import { useState } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { ethers } from 'ethers'

export default function AgentUpload() {
  const [agentId, setAgentId] = useState('financial-advisor')
  const [manifestText, setManifestText] = useState('')
  const [codeText, setCodeText] = useState('')
  const [fileManifest, setFileManifest] = useState(null)
  const [fileCode, setFileCode] = useState(null)
  const [status, setStatus] = useState(null)
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()

  const [uploadedManifest, setUploadedManifest] = useState(null)
  const [lastManifestUrl, setLastManifestUrl] = useState(null)
  const [debug, setDebug] = useState({})

  const upload = async () => {
    console.debug('[AgentUpload] starting upload', { agentId, fileManifest, fileCode })
    setStatus('Uploading...')
    try {
      const form = new FormData()
      form.append('agentId', agentId)
      if (fileManifest) form.append('manifest', fileManifest)
      else form.append('manifest', new Blob([manifestText], { type: 'application/json' }), `${agentId}_manifest.json`)
      if (fileCode) form.append('code', fileCode)
      else form.append('code', new Blob([codeText], { type: 'text/plain' }), `${agentId}_agent.py`)

      const res = await fetch('/api/agent-upload', { method: 'POST', body: form })
  const data = await res.json()
  console.debug('[AgentUpload] upload response', data)
    if (!res.ok) throw new Error(JSON.stringify(data))
    setStatus('Uploaded: ' + (data.manifestUrl || 'ok'))
    if (data.manifestUrl) setLastManifestUrl(data.manifestUrl)
    setDebug((d) => ({ ...d, uploadResponse: data }))
      // store manifest for possible registration
      try {
        // try to parse manifest from text or file
        let manifestObj = null
        if (fileManifest) {
          // read file as text
          const txt = await fileManifest.text()
          manifestObj = JSON.parse(txt)
        } else if (manifestText) {
          manifestObj = JSON.parse(manifestText)
        }
        setUploadedManifest(manifestObj)
      } catch (err) {
        // ignore; registration will validate again
        setUploadedManifest(null)
      }
      setDebug((d) => ({ ...d, uploadedManifest }))
      } catch (_) {
        console.debug('[AgentUpload] upload error', _)
        setStatus('Upload failed: ' + String(_))
    }
  }

  async function registerWithWallet() {
    console.debug('[AgentUpload] registerWithWallet start', { agentId, uploadedManifest, manifestText, fileManifest })
    if (!isConnected || !address) {
      setStatus('Connect your wallet first')
      return
    }

    // get manifest object
    let manifestObj = uploadedManifest
    if (!manifestObj) {
      try {
        if (fileManifest) {
          manifestObj = JSON.parse(await fileManifest.text())
        } else if (manifestText) {
          manifestObj = JSON.parse(manifestText)
        } else {
          setStatus('No manifest available to register')
          return
        }
      } catch (err) {
        setStatus('Manifest JSON invalid: ' + String(err))
        return
      }
    }

    try {
    // fetch nonce
    console.debug('[AgentUpload] fetching nonce', { address })
    const nonceRes = await fetch(`/api/nonce?subject=${address}&purpose=register`)
    const nonceJson = await nonceRes.json()
    console.debug('[AgentUpload] nonce response', nonceJson)
    if (!nonceRes.ok) throw new Error(JSON.stringify(nonceJson))
    const nonce = nonceJson.nonce

    // canonical message
    const messageText = `Register agent:${agentId}:${address}:${nonce}`
    console.debug('[AgentUpload] canonical message', { messageText })
    setDebug((d) => ({ ...d, nonce, messageText }))

    setStatus('Requesting wallet signature...')
    const signature = await signMessageAsync({ message: messageText })
    console.debug('[AgentUpload] got signature', { signature })
    setDebug((d) => ({ ...d, signature }))

    // expose debug info in status for quick copy-paste
    setStatus(`Signed message ready. nonce=${nonce}`)

      // client-side verification using ethers to detect mismatches early
      try {
        const recovered = ethers.verifyMessage(messageText, signature)
        console.debug('[AgentUpload] recovered address', { recovered })
        // append recovered to status so user can see it
        setStatus((s) => (s ? s + '\n' : '') + `Recovered locally: ${recovered}`)
        setDebug((d) => ({ ...d, recovered }))
        if (recovered.toLowerCase() !== address.toLowerCase()) {
          setStatus('Signature mismatch: recovered ' + recovered + ' but wallet address is ' + address + '. Signature: ' + signature)
          return
        }
      } catch (e) {
        console.debug('[AgentUpload] local verification failed', e)
        setStatus('Failed to verify signature locally: ' + String(e))
        setDebug((d) => ({ ...d, localVerifyError: String(e) }))
        return
      }

      setStatus('Submitting registration to backend...')

      const payload = {
        owner: address,
        agentId: agentId,
        domain: manifestObj.domain || '',
        description: manifestObj.description || '',
        manifestUrl: manifestObj.manifestUrl || lastManifestUrl || '',
        scoringInputs: manifestObj.scoringInputs || {},
        nonce: nonce,
        signature: signature
      }
  console.debug('[AgentUpload] registration payload', payload)
  setDebug((d) => ({ ...d, payload }))

      const regRes = await fetch('/api/agent-register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const regJson = await regRes.json()
      console.debug('[AgentUpload] registration response', regJson)
      setDebug((d) => ({ ...d, serverResponse: regJson }))
      if (!regRes.ok) {
        // show server error fields in a friendly way
        const serverError = regJson?.error || JSON.stringify(regJson)
        const serverRecovered = regJson?.recovered
        console.debug('[AgentUpload] server error', { serverError, serverRecovered })
        setStatus(`Registration failed: ${serverError}` + (serverRecovered ? `\nserver recovered: ${serverRecovered}` : ''))
        return
      }
      setStatus('Registration successful: ' + JSON.stringify(regJson))
    } catch (err) {
      console.debug('[AgentUpload] registration error', err)
      setStatus('Registration failed: ' + String(err))
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Upload / Publish Agent</h2>
      <div style={{ display: 'grid', gap: 8 }}>
        <label>
          Agent ID (slug):
          <input value={agentId} onChange={(e) => setAgentId(e.target.value)} />
        </label>

        <label>
          Manifest (paste JSON) or choose file:
          <textarea rows={8} value={manifestText} onChange={(e) => setManifestText(e.target.value)} placeholder='Paste manifest JSON here' />
          <input type='file' accept='.json' onChange={(e) => setFileManifest(e.target.files?.[0] || null)} />
        </label>

        <label>
          Code (paste Python) or choose file:
          <textarea rows={12} value={codeText} onChange={(e) => setCodeText(e.target.value)} placeholder='Paste Python code here' />
          <input type='file' accept='.py' onChange={(e) => setFileCode(e.target.files?.[0] || null)} />
        </label>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={upload}>Upload & Publish</button>
          <button onClick={registerWithWallet} disabled={!lastManifestUrl}>Register with Wallet</button>
        </div>

        {status && <pre style={{ whiteSpace: 'pre-wrap' }}>{status}</pre>}
        <div style={{ marginTop: 12 }}>
          <strong>Debug:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{JSON.stringify(debug, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}
