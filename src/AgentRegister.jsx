import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'

export default function AgentRegister() {
  const { address, isConnected } = useAccount()
  const [agentId, setAgentId] = useState('')
  const [domain, setDomain] = useState('')
  const [description, setDescription] = useState('')
  const [manifestUrl, setManifestUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [debug, setDebug] = useState({})

  async function register() {
    if (!isConnected || !address) return alert('Connect your wallet')
    if (!agentId) return alert('agentId required')
    try {
      setLoading(true)
      setStatus('requesting nonce...')
  // obtain a nonce for this owner registration to prevent replay attacks
  const nonceRes = await fetch(`/api/nonce?subject=${address}&purpose=register`)
  const nonceData = await nonceRes.json()
  const nonce = nonceData.nonce
  const message = `Register agent:${agentId}:${address}:${nonce}`
  setDebug((d) => ({ ...d, nonce, message }))
  console.debug('AgentRegister: nonce, message', nonce, message)
      // Prefer injected MetaMask if present
      let signature = null
      if (typeof window !== 'undefined' && window.ethereum) {
        const eth = window.ethereum
        let metaProvider = null
        if (eth.providers && Array.isArray(eth.providers)) metaProvider = eth.providers.find((p) => p.isMetaMask)
        if (!metaProvider && eth.isMetaMask) metaProvider = eth
        if (metaProvider) {
          const provider = new ethers.BrowserProvider(metaProvider)
          const signer = await provider.getSigner()
          signature = await signer.signMessage(message)
        }
      }
      // Fallback: attempt using window.ethereum directly
      if (!signature && typeof window !== 'undefined' && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        signature = await signer.signMessage(message)
      }
      // If still no signature, abort
      if (!signature) {
        setStatus('unable to sign message')
        return alert('Unable to sign message')
      }

      setDebug((d) => ({ ...d, signature }))
      console.debug('AgentRegister: signature', signature)

      setStatus('posting registration to server...')
      const res = await fetch('/api/agent-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: address, agentId, domain, description, manifestUrl, signature, nonce }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.warn('AgentRegister: server error', err)
        setStatus('server rejected registration')
        setDebug((d) => ({ ...d, serverError: err }))
        throw new Error(err.error || 'registration failed')
      }
      const data = await res.json()
      setStatus('registration successful')
      setDebug((d) => ({ ...d, serverResponse: data }))
      alert('Registered: ' + JSON.stringify(data.agent || data))
    } catch (e) {
      console.error('AgentRegister error', e)
      setStatus('registration failed')
      alert('Registration failed: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Register Agent</h2>
      <div style={{ display: 'grid', gap: 8, maxWidth: 680 }}>
        <label>Agent ID</label>
        <input value={agentId} onChange={(e) => setAgentId(e.target.value)} placeholder="unique-agent-id" />
        <label>Domain</label>
        <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="legal / medical / finance" />
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
        <label>Manifest URL</label>
        <input value={manifestUrl} onChange={(e) => setManifestUrl(e.target.value)} placeholder="https://..." />
          <div>
            <button onClick={register} disabled={!isConnected || loading}>{loading ? 'Registering...' : 'Register Agent'}</button>
          </div>
          <div style={{ marginTop: 12 }}>
            <strong>Status:</strong> {status}
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{JSON.stringify(debug, null, 2)}</pre>
          </div>
      </div>
    </div>
  )
}
