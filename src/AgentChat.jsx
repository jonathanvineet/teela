import { useState, useEffect, useRef } from 'react'
import { useAccount, useSigner } from 'wagmi'
import { ethers } from 'ethers'

export default function AgentChat({ agentName = 'Alice', onClose }) {
  const { address, isConnected } = useAccount()
  const { data: wagmiSigner } = useSigner()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
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
    if (!isConnected || !address) return
    try {
      // Prefer MetaMask when multiple wallets are injected (e.g., OKX + MetaMask)
      let signature = null

      // If multiple injected providers exist, prefer MetaMask's provider so the
      // signature definitely comes from the MetaMask extension (not other wallets)
      if (typeof window !== 'undefined' && window.ethereum) {
        const eth = window.ethereum
        let metaProvider = null
        if (eth.providers && Array.isArray(eth.providers)) {
          metaProvider = eth.providers.find((p) => p.isMetaMask)
        }
        if (!metaProvider && eth.isMetaMask) metaProvider = eth

        if (metaProvider) {
          const provider = new ethers.BrowserProvider(metaProvider)
          const mmSigner = await provider.getSigner()
          const message = `Rent agent:${agentName}`
          signature = await mmSigner.signMessage(message)
        }
      }

      // Fall back to wagmi's connected signer if we didn't obtain a MetaMask
      // signature above. wagmi's signer will sign with the currently connected
      // wallet (Connector selected in RainbowKit).
      if (!signature) {
        if (!wagmiSigner) {
          alert('No signer available to create signature')
          return
        }
        const message = `Rent agent:${agentName}`
        signature = await wagmiSigner.signMessage(message)
      }

      const res = await fetch('/api/agent-rent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agentName, user: address, signature }),
      })
      if (!res.ok) throw new Error('rent failed')
      const data = await res.json()
      if (data.success) {
        // Refresh permission state from server
        await checkPermission()
      }
    } catch (err) {
      console.error(err)
      alert('Failed to rent agent')
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
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

      <div ref={scrollRef} style={{ height: 320, overflowY: 'auto', border: '1px solid #eee', padding: 12, borderRadius: 8, background: '#fafafa' }}>
        {messages.length === 0 && <p style={{ color: '#666' }}>No messages yet. Say hi 👋</p>}
        {messages.map((m, idx) => (
          <div key={idx} style={{ display: 'flex', marginBottom: 8, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '70%', padding: '8px 12px', borderRadius: 12, background: m.role === 'user' ? '#DCF8C6' : m.role === 'agent' ? '#fff' : '#ffe6e6', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 14, color: '#111' }}>{m.text}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>{m.role}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={isConnected ? (permitted ? 'Type a message...' : 'Rent to enable chat') : 'Connect wallet to chat'} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd' }} />
        <button onClick={sendMessage} disabled={!isConnected || !input || loading || !permitted} style={{ padding: '8px 12px', borderRadius: 8 }}>{loading ? 'Sending...' : 'Send'}</button>
      </div>
    </div>
  )
}
