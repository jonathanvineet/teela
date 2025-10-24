import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

const TRACKS = [
  { id: 'legal', name: 'Legal Advisor', desc: 'Contract review, compliance, legal disclaimers.' },
  { id: 'finance', name: 'Financial Advisor', desc: 'Budgeting, tax guidance, investment basics.' },
  { id: 'medical', name: 'Medical Advisor', desc: 'Triage & non-diagnostic guidance.' },
  { id: 'real-estate', name: 'Real Estate Advisor', desc: 'Property search, rent estimates, lease tips.' },
  { id: 'hr', name: 'HR / Recruitment', desc: 'Resume screening and interview prep.' },
  { id: 'compliance', name: 'Compliance & Privacy', desc: 'Data handling, audits and remediations.' }
]

export default function AgentsList({ onOpenChat }) {
  const { address, isConnected } = useAccount()
  const [listings, setListings] = useState([])
  const [selectedTrack, setSelectedTrack] = useState(null)
  const [permissions, setPermissions] = useState({})

  useEffect(() => {
    // prefetch listings for quick track drilldown
    fetchListings()
  }, [])

  useEffect(() => {
    if (!isConnected || !address) return
    // if a track is open, refresh permissions
    if (selectedTrack) checkPermissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, selectedTrack])

  async function fetchListings() {
    try {
      const res = await fetch('/api/agent-listings')
      if (!res.ok) return
      const data = await res.json()
      setListings(data.listings || [])
    } catch (e) {
      console.error(e)
    }
  }

  async function checkPermissions() {
    const perms = {}
    const filtered = listings.filter(l => (l.domain || '').toLowerCase() === (selectedTrack || '').toLowerCase())
    await Promise.all(filtered.map(async (l) => {
      try {
        const res = await fetch(`/api/agent-permission?user=${address}&agent=${l.id}`)
        if (!res.ok) return
        const data = await res.json()
        perms[l.id] = !!data.permitted
      } catch (err) {
        console.error(err)
        perms[l.id] = false
      }
    }))
    setPermissions(perms)
  }

  const agentsInTrack = selectedTrack ? listings.filter(l => (l.domain || '').toLowerCase() === selectedTrack.toLowerCase()) : []

  return (
    <div style={{ padding: 20 }}>
      <h2>Tracks</h2>
      <p style={{ color: '#555' }}>Choose a track to discover agents aligned to that theme.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {TRACKS.map(t => (
          <div key={t.id} style={{ border: '1px solid #eee', padding: 12, borderRadius: 8, background: '#fff' }}>
            <h3 style={{ margin: 0 }}>{t.name}</h3>
            <p style={{ color: '#666', marginTop: 6 }}>{t.desc}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <small style={{ color: '#888' }}>{listings.filter(l => (l.domain || '').toLowerCase() === t.id).length} agents</small>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setSelectedTrack(t.id)}>Open</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedTrack && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Track: {TRACKS.find(t => t.id === selectedTrack)?.name || selectedTrack}</h2>
            <div>
              <button onClick={() => { setSelectedTrack(null); setPermissions({}) }}>Close</button>
            </div>
          </div>

          {agentsInTrack.length === 0 ? (
            <div style={{ padding: 12, border: '1px dashed #ddd', borderRadius: 8 }}>
              <p style={{ margin: 0 }}>No agents currently listed for this track. Upload your agent under this domain to be discoverable.</p>
              <p style={{ marginTop: 8 }}><strong>Tip:</strong> Go to Upload Agent and set the Domain to <code>{selectedTrack}</code>.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginTop: 12 }}>
              {agentsInTrack.map((l) => (
                <div key={l.id} style={{ border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
                  <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{l.name}</span>
                    <small style={{ color: '#666' }}>{l.domain || 'unknown'}</small>
                  </h3>
                  <p style={{ color: '#666' }}>{l.description}</p>
                  <p>Price: {l.price} • Score: <strong>{l.score ?? 'unscored'}</strong></p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button disabled={!isConnected} onClick={() => onOpenChat(l)}>{permissions[l.id] ? 'Chat' : 'Rent & Chat'}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
