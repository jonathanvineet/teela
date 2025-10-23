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
  const [evaluating, setEvaluating] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState(null)
  const [rentalContractAddress, setRentalContractAddress] = useState('')
  const [rentalStatus, setRentalStatus] = useState(null)

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
      } catch {
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
      } catch (_) {
        console.debug('[AgentUpload] registration error', _)
        setStatus('Registration failed: ' + String(_))
    }
  }

  async function startRentWallet() {
    console.debug('[AgentUpload] startRentWallet', { rentalStatus, rentalContractAddress, agentId, address })
    if (!isConnected || !address) {
      setStatus('Connect your wallet first')
      return
    }
    if (!rentalStatus || !rentalStatus.rentalAmountWei) {
      setStatus('Fetch rental status first')
      return
    }
    if (!rentalContractAddress) {
      setStatus('No rental contract address provided')
      return
    }

    try {
      // ethers v6 BrowserProvider from window.ethereum
      if (!window.ethereum) {
        setStatus('No injected wallet found (window.ethereum)')
        return
      }
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      // minimal ABI for rent()
      const abi = ["function rent() payable"]
      const contract = new ethers.Contract(rentalContractAddress, abi, signer)

      const amountWei = rentalStatus.rentalAmountWei
      setStatus('Sending transaction to rent — please confirm in your wallet...')
      const tx = await contract.rent({ value: BigInt(amountWei) })
      setDebug((d) => ({ ...d, rentTx: { hash: tx.hash, tx } }))
      setStatus('Transaction submitted: ' + tx.hash + ' — waiting for confirmation...')

      const receipt = await tx.wait()
      setDebug((d) => ({ ...d, rentReceipt: receipt }))
      setStatus('Transaction confirmed: ' + tx.hash)

      // notify backend to verify and update server-side rentals
      try {
        const res = await fetch('/api/agent-verify-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId, user: address, txHash: tx.hash }) })
        const json = await res.json()
        setDebug((d) => ({ ...d, verifyResponse: json }))
        if (!res.ok) throw new Error(JSON.stringify(json))
        setStatus('Payment verified by server: ' + JSON.stringify(json))
      } catch (e) {
        setStatus('Payment verification failed: ' + String(e))
        setDebug((d) => ({ ...d, verifyError: String(e) }))
      }
    } catch (e) {
      console.debug('[AgentUpload] startRentWallet error', e)
      setStatus('Rent transaction failed: ' + String(e))
      setDebug((d) => ({ ...d, rentError: String(e) }))
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
            <button onClick={async () => {
              if (!uploadedManifest && !lastManifestUrl) return setStatus('No manifest available for evaluation')
              setEvaluating(true)
              setStatus('Running evaluation...')
              // build test prompts from manifest.scoringInputs or a default set
              const scoring = (uploadedManifest && uploadedManifest.scoringInputs) || (uploadedManifest && uploadedManifest.scoringInputs) || {}
              let prompts = []
              if (scoring && scoring.metrics) {
                // example mapping: create simple prompts based on domain
                prompts = [
                  { prompt: 'How can I reduce monthly expenses?', expectedKeywords: ['expense','budget','save'] },
                  { prompt: 'What should I do with an unexpected cash windfall?', expectedKeywords: ['save','invest','pay off'] }
                ]
              } else {
                prompts = [
                  { prompt: 'How can I reduce monthly expenses?', expectedKeywords: ['expense','budget'] },
                  { prompt: 'What should I do with unexpected income?', expectedKeywords: ['save','invest','pay off'] }
                ]
              }
              try {
                const res = await fetch('/api/agent-evaluate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId, testPrompts: prompts }) })
                const data = await res.json()
                setEvaluationResult(data)
                setDebug((d) => ({ ...d, lastEvaluation: data }))
                setStatus('Evaluation complete: score=' + (data?.evaluation?.score ?? 'n/a'))
              } catch (e) {
                setStatus('Evaluation failed: ' + String(e))
                setDebug((d) => ({ ...d, evalError: String(e) }))
              } finally {
                setEvaluating(false)
              }
            }} disabled={evaluating || !lastManifestUrl}>{evaluating ? 'Running...' : 'Run Evaluation'}</button>

            <button onClick={async () => {
              if (!uploadedManifest && !lastManifestUrl) return setStatus('No manifest available for security audit')
              setEvaluating(true)
              setStatus('Running security audit...')
              // minimal testPrompts required by backend; content ignored by security audit
              const prompts = [{ prompt: 'security audit placeholder' }]
              try {
                const res = await fetch('/api/agent-evaluate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId, securityAudit: true, testPrompts: prompts, debug: true }) })
                const data = await res.json()
                setEvaluationResult(data)
                setDebug((d) => ({ ...d, lastSecurityAudit: data }))
                setStatus('Security audit complete: score=' + (data?.evaluation?.score ?? 'n/a'))
              } catch (e) {
                setStatus('Security audit failed: ' + String(e))
                setDebug((d) => ({ ...d, auditError: String(e) }))
              } finally {
                setEvaluating(false)
              }
            }} disabled={evaluating || !lastManifestUrl}>{evaluating ? 'Running...' : 'Run Security Audit'}</button>
        </div>

        <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
          <h3>On-chain Rental</h3>
          <label>
            Deployed Rental Contract Address:
            <input value={rentalContractAddress} onChange={(e) => setRentalContractAddress(e.target.value)} placeholder='0x...' />
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={async () => {
              if (!rentalContractAddress) return setStatus('Enter contract address')
              try {
                const res = await fetch('/api/agent-set-rental-contract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId, contractAddress: rentalContractAddress }) })
                const data = await res.json()
                setDebug((d) => ({ ...d, setRentalContract: data }))
                if (!res.ok) throw new Error(JSON.stringify(data))
                setStatus('Registered rental contract: ' + data.contractAddress)
              } catch (e) {
                setStatus('Failed to register contract: ' + String(e))
              }
            }}>Register Contract</button>

            <button onClick={async () => {
              try {
                const q = new URLSearchParams({ agent: agentId })
                const res = await fetch('/api/agent-rental-status?' + q.toString())
                const data = await res.json()
                setRentalStatus(data)
                setDebug((d) => ({ ...d, rentalStatus: data }))
                if (!res.ok) throw new Error(JSON.stringify(data))
                setStatus('Rental status fetched')
              } catch (e) {
                setStatus('Failed to fetch rental status: ' + String(e))
              }
            }}>Fetch Rental Status</button>

            <button onClick={startRentWallet}>Start Rent (wallet)</button>
          </div>
        </div>

        {status && <pre style={{ whiteSpace: 'pre-wrap' }}>{status}</pre>}
        <div style={{ marginTop: 12 }}>
          <strong>Debug:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{JSON.stringify({ ...debug, evaluationResult }, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}
