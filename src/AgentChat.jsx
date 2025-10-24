import { useState, useEffect, useRef } from 'react'
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'

export default function AgentChat({ agentName = 'Alice', onClose }) {
  const { address, isConnected } = useAccount()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [debug, setDebug] = useState({})
  const [rentalStatus, setRentalStatus] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!isConnected || !address) return
    fetchHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address])

  const [permitted, setPermitted] = useState(false)

  useEffect(() => {
    if (!isConnected || !address) return
    checkPermission()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address])

  async function checkPermission() {
    try {
      const res = await fetch(`/api/agent-permission?user=${address}&agent=${agentName}`)
      if (!res.ok) return
      const data = await res.json()
      setPermitted(!!data.permitted)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  async function fetchHistory() {
    try {
      const res = await fetch(`/api/agent-chat/history?user=${address}`)
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.history || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function sendMessage() {
    if (!input || !isConnected || !address) return
    const userMsg = { role: 'user', text: input }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: address, agent: agentName, message: userMsg.text }),
      })
      if (!res.ok) throw new Error('network')
      const data = await res.json()
      const agentMsg = { role: 'agent', text: data.reply }
      setMessages((m) => [...m, agentMsg])
    } catch (err) {
      console.error(err)
      setMessages((m) => [...m, { role: 'system', text: 'Failed to send message' }])
    } finally {
      setLoading(false)
    }
  }

  async function rentAgent() {
    // New flow: prefer on-chain payment. If caller is owner, they are already permitted.
    if (!isConnected || !address) return
    try {
      // First, fetch the rental status (price) from backend
      const q = new URLSearchParams({ agent: agentName })
      const statusRes = await fetch('/api/agent-rental-status?' + q.toString())
      if (!statusRes.ok) throw new Error('failed to fetch rental status')
      const statusJson = await statusRes.json()
      setRentalStatus(statusJson)

      // If backend says owner (permitted) just refresh permission
      if (statusJson.owner && statusJson.owner.toLowerCase() === address.toLowerCase()) {
        await checkPermission()
        return
      }

      const priceWei = statusJson.rentalAmountWei || statusJson.priceWei || '0'
      const registryAddress = statusJson.contractAddress || '0x4dc335A01C9E67f532dE68D9475c36001Df5396E'

      if (!window.ethereum) {
        alert('No injected wallet available for on-chain rent')
        return
      }

      // prepare signer and contract
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const abi = ['function rentAgent(bytes32) payable']
      const contract = new ethers.Contract(registryAddress, abi, signer)

      // encode agentId -> bytes32
      const toBytes32 = (str) => {
        let b = ethers.toUtf8Bytes(String(str || ''))
        if (b.length > 32) b = b.slice(0, 32)
        const arr = new Uint8Array(32)
        arr.set(b, 0)
        return ethers.hexlify(arr)
      }
      const agentBytes = toBytes32(agentName)

      // send payable transaction
      const tx = await contract.rentAgent(agentBytes, { value: BigInt(priceWei) })
      setStatus('Transaction submitted: ' + tx.hash + ' — waiting for confirmation...')
      setDebug((d) => ({ ...d, rentTx: { hash: tx.hash } }))
      const receipt = await tx.wait()
      setDebug((d) => ({ ...d, rentReceipt: receipt }))
      setStatus('Transaction confirmed: ' + tx.hash)

      // Notify backend to verify and update server-side permissions
      try {
        const verifyRes = await fetch('/api/agent-verify-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId: agentName, user: address, txHash: tx.hash }) })
        const verifyJson = await verifyRes.json()
        setDebug((d) => ({ ...d, verifyResponse: verifyJson }))
        if (!verifyRes.ok) throw new Error(JSON.stringify(verifyJson))
        // Refresh permission
        await checkPermission()
      } catch (ve) {
        console.error('verification failed', ve)
        alert('Payment succeeded but server verification failed: ' + String(ve))
      }
    } catch (err) {
      console.error(err)
      alert('Failed to rent agent on-chain: ' + String(err))
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Chat with Agent {agentName}</h2>
        <div>
          <button onClick={onClose}>Close</button>
        </div>
      </header>

      <p>Agent address: <code>agent1-{agentName.toLowerCase()}</code></p>

      <div style={{ marginBottom: 8 }}>
        {permitted ? (
          <strong style={{ color: 'green' }}>You have rented this agent — chat enabled</strong>
        ) : (
          <div>
            <button onClick={rentAgent} disabled={!isConnected}>Rent this agent</button>
            <small style={{ marginLeft: 8, color: '#666' }}>Renting is an off-chain signature (demo)</small>
          </div>
        )}
      </div>

      <div ref={scrollRef} className="glass" style={{ height: 360, overflowY: 'auto', padding: 14, borderRadius: 12 }}>
        {messages.length === 0 && <p style={{ color: '#666' }}>No messages yet. Say hi 👋</p>}
        {messages.map((m, idx) => (
          <div key={idx} style={{ display: 'flex', marginBottom: 10, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div className={`bubble ${m.role}`}>
              <div style={{ fontSize: 14, color: '#111' }}>{m.text}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>{m.role}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={isConnected ? (permitted ? 'Type a message...' : 'Rent to enable chat') : 'Connect wallet to chat'} style={{ flex: 1 }} />
        <button onClick={sendMessage} disabled={!isConnected || !input || loading || !permitted}>{loading ? 'Sending...' : 'Send'}</button>
      </div>
      {status && <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{status}</pre>}
      <div style={{ marginTop: 8 }}>
        <strong>Debug:</strong>
  <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{JSON.stringify({ ...debug, rentalStatus }, null, 2)}</pre>
      </div>
    </div>
  )
}
