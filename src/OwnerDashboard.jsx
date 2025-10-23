import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'

export default function OwnerDashboard() {
  const { address, isConnected } = useAccount()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isConnected || !address) return
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address])

  async function fetchStats() {
    try {
      setLoading(true)
      const res = await fetch(`/api/agent-owner-stats?owner=${address}`)
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setAgents(data.agents || [])
    } catch (e) {
      console.error(e)
      setAgents([])
    } finally {
      setLoading(false)
    }
  }

  async function triggerScore(agentId) {
    try {
      const res = await fetch('/api/agent-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agentId })
      })
      if (!res.ok) throw new Error('score failed')
      const data = await res.json()
      alert('Score updated: ' + JSON.stringify(data))
      fetchStats()
    } catch (e) {
      console.error(e)
      alert('Failed to trigger score')
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Owner Dashboard</h2>
      {!isConnected && <p>Connect your wallet to view your agents.</p>}
      {loading && <p>Loading...</p>}
      <div style={{ display: 'grid', gap: 12 }}>
        {agents.map((a) => (
          <div key={a.agentId} style={{ border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
            <h3>{a.agentId} <small style={{ color: '#666' }}>{a.domain}</small></h3>
            <p style={{ color: '#666' }}>{a.description}</p>
            <p>Score: <strong>{a.score}</strong> • Rent count: {a.rentCount} • Chat count: {a.chatCount}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => triggerScore(a.agentId)}>Run Scoring</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
