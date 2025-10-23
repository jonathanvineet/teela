import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

export default function AgentsList({ onOpenChat }) {
  const { address, isConnected } = useAccount()
  const [listings, setListings] = useState([])
  const [permissions, setPermissions] = useState({})

  useEffect(() => {
    fetchListings()
  }, [])

  useEffect(() => {
    // when listings are loaded or account changes, re-check permissions
    if (listings.length > 0 && isConnected && address) {
      checkPermissions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings, isConnected, address])

  useEffect(() => {
    if (!isConnected || !address) return
    checkPermissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address])

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
    await Promise.all(listings.map(async (l) => {
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

  return (
    <div style={{ padding: 20 }}>
      <h2>Agents</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
        {listings.map((l) => (
          <div key={l.id} style={{ border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
            <h3>{l.name}</h3>
            <p style={{ color: '#666' }}>{l.description}</p>
            <p>Price: {l.price}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={!isConnected} onClick={() => onOpenChat(l)}>{permissions[l.id] ? 'Chat' : 'Rent & Chat'}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
