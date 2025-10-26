import { useState, useEffect } from 'react'
import { ParticleCard } from '../MagicBento'

const ENVIO_GRAPHQL_URL = 'https://indexer.bigdevenergy.link/YOUR_DEPLOYMENT_ID/v1/graphql'

export default function AgentScoreDashboard() {
  const [agents, setAgents] = useState([])
  const [globalStats, setGlobalStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [agentHistory, setAgentHistory] = useState([])
  const [timeRange, setTimeRange] = useState('all') // all, 7d, 30d

  // Fetch all agents with scores
  const fetchAgents = async () => {
    try {
      const query = `
        query GetAgents {
          Agent(order_by: {averageScore: desc}) {
            id
            agentId
            totalScore
            sessionCount
            averageScore
            totalRevenue
            lastUpdated
          }
          GlobalStats(where: {id: {_eq: "global"}}) {
            totalAgents
            totalSessions
            totalRevenue
            lastUpdated
          }
        }
      `

      const response = await fetch(ENVIO_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      const { data } = await response.json()
      
      if (data.Agent) {
        setAgents(data.Agent)
      }
      
      if (data.GlobalStats && data.GlobalStats.length > 0) {
        setGlobalStats(data.GlobalStats[0])
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching agents:', error)
      setLoading(false)
    }
  }

  // Fetch agent score history
  const fetchAgentHistory = async (agentId) => {
    try {
      const query = `
        query GetAgentHistory($agentId: String!) {
          ScoreEvent(
            where: {agentId: {_eq: $agentId}}
            order_by: {timestamp: desc}
            limit: 50
          ) {
            id
            score
            revenue
            timestamp
            blockNumber
            transactionHash
          }
        }
      `

      const response = await fetch(ENVIO_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query,
          variables: { agentId }
        })
      })

      const { data } = await response.json()
      
      if (data.ScoreEvent) {
        setAgentHistory(data.ScoreEvent)
      }
    } catch (error) {
      console.error('Error fetching agent history:', error)
    }
  }

  useEffect(() => {
    fetchAgents()
    // Refresh every 10 seconds for real-time updates
    const interval = setInterval(fetchAgents, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedAgent) {
      fetchAgentHistory(selectedAgent.agentId)
    }
  }, [selectedAgent])

  const formatEth = (wei) => {
    if (!wei) return '0'
    return (Number(wei) / 1e18).toFixed(6)
  }

  const formatTimestamp = (ts) => {
    if (!ts) return ''
    return new Date(Number(ts) * 1000).toLocaleString()
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: 20, color: 'rgba(255,255,255,0.7)' }}>
          Loading agent scores from blockchain...
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ 
          fontSize: 42, 
          fontWeight: 700,
          margin: '0 0 12px',
          background: 'linear-gradient(135deg, #fff 0%, #a78bfa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Agent Performance Dashboard
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
          Real-time on-chain agent scoring powered by Envio HyperIndex
        </p>
      </div>

      {/* Global Stats */}
      {globalStats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 20,
          marginBottom: 32
        }}>
          <ParticleCard className="glass" style={{ padding: 24 }}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
              Total Agents
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>
              {globalStats.totalAgents?.toString() || '0'}
            </div>
          </ParticleCard>

          <ParticleCard className="glass" style={{ padding: 24 }}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
              Total Sessions
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#00d4ff' }}>
              {globalStats.totalSessions?.toString() || '0'}
            </div>
          </ParticleCard>

          <ParticleCard className="glass" style={{ padding: 24 }}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
              Total Revenue
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#51cf66' }}>
              {formatEth(globalStats.totalRevenue)} ETH
            </div>
          </ParticleCard>

          <ParticleCard className="glass" style={{ padding: 24 }}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
              Last Updated
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
              {formatTimestamp(globalStats.lastUpdated)}
            </div>
          </ParticleCard>
        </div>
      )}

      {/* Agent List */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 20, color: '#fff' }}>
          Agent Leaderboard
        </h2>

        <div style={{ display: 'grid', gap: 16 }}>
          {agents.map((agent, index) => (
            <ParticleCard 
              key={agent.id}
              className="glass colorful"
              style={{ 
                padding: 24,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => setSelectedAgent(agent)}
              enableTilt={true}
              clickEffect={true}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                {/* Rank */}
                <div style={{ 
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: index === 0 ? 'linear-gradient(135deg, #ffd700, #ffed4e)' :
                              index === 1 ? 'linear-gradient(135deg, #c0c0c0, #e8e8e8)' :
                              index === 2 ? 'linear-gradient(135deg, #cd7f32, #e6a85c)' :
                              'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                  color: index < 3 ? '#000' : '#fff',
                  flexShrink: 0
                }}>
                  {index + 1}
                </div>

                {/* Agent Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                    {agent.agentId}
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                    {agent.sessionCount?.toString() || '0'} sessions
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                      Avg Score
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#00d4ff' }}>
                      {agent.averageScore?.toString() || '0'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                      Total Score
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#a78bfa' }}>
                      {agent.totalScore?.toString() || '0'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                      Revenue
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#51cf66' }}>
                      {formatEth(agent.totalRevenue)} ETH
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.4)' }}>
                  →
                </div>
              </div>
            </ParticleCard>
          ))}
        </div>
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}
        onClick={() => setSelectedAgent(null)}
        >
          <ParticleCard 
            className="glass colorful"
            style={{ 
              maxWidth: 900,
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              padding: 32
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 28, margin: '0 0 8px', color: '#fff' }}>
                  {selectedAgent.agentId}
                </h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                  Last updated: {formatTimestamp(selectedAgent.lastUpdated)}
                </p>
              </div>
              <button 
                onClick={() => setSelectedAgent(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  padding: '8px 16px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 16
                }}
              >
                ✕ Close
              </button>
            </div>

            {/* Stats Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 16,
              marginBottom: 32
            }}>
              <div style={{ 
                background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: 12,
                padding: 16
              }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                  Average Score
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#00d4ff' }}>
                  {selectedAgent.averageScore?.toString() || '0'}
                </div>
              </div>

              <div style={{ 
                background: 'rgba(167, 139, 250, 0.1)',
                border: '1px solid rgba(167, 139, 250, 0.3)',
                borderRadius: 12,
                padding: 16
              }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                  Total Score
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#a78bfa' }}>
                  {selectedAgent.totalScore?.toString() || '0'}
                </div>
              </div>

              <div style={{ 
                background: 'rgba(81, 207, 102, 0.1)',
                border: '1px solid rgba(81, 207, 102, 0.3)',
                borderRadius: 12,
                padding: 16
              }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                  Sessions
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#51cf66' }}>
                  {selectedAgent.sessionCount?.toString() || '0'}
                </div>
              </div>

              <div style={{ 
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: 12,
                padding: 16
              }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                  Total Revenue
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#ffd700' }}>
                  {formatEth(selectedAgent.totalRevenue)} ETH
                </div>
              </div>
            </div>

            {/* Score History */}
            <div>
              <h3 style={{ fontSize: 20, marginBottom: 16, color: '#fff' }}>
                Score History
              </h3>
              
              <div style={{ 
                maxHeight: 400,
                overflow: 'auto',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 12,
                padding: 16
              }}>
                {agentHistory.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
                    No score history yet
                  </p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <th style={{ padding: '12px 8px', textAlign: 'left', color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                          Time
                        </th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                          Score
                        </th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                          Revenue
                        </th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                          Block
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {agentHistory.map((event) => (
                        <tr key={event.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '12px 8px', color: '#fff', fontSize: 14 }}>
                            {formatTimestamp(event.timestamp)}
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', color: '#00d4ff', fontSize: 16, fontWeight: 600 }}>
                            {event.score?.toString() || '0'}
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', color: '#51cf66', fontSize: 14 }}>
                            {formatEth(event.revenue)} ETH
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                            {event.blockNumber?.toString() || '0'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </ParticleCard>
        </div>
      )}
    </div>
  )
}
