import { useState, useEffect, useRef } from 'react'
import { useAccount } from 'wagmi'

export default function OwnerDashboard() {
  const { address, isConnected } = useAccount()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(false)
  const [agentverseAgents, setAgentverseAgents] = useState([])
  const [agentverseLoading, setAgentverseLoading] = useState(false)
  const [connectingAgent, setConnectingAgent] = useState(null)
  const [selectedDomain, setSelectedDomain] = useState('')
  const [editingAgent, setEditingAgent] = useState(null)
  const [editCodeText, setEditCodeText] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editStatus, setEditStatus] = useState(null)
  const [showSplitView, setShowSplitView] = useState(false)
  const gutterRef = useRef(null)
  const scrollerRef = useRef(null)
  const preRef = useRef(null)

  // Close modal on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') { setEditingAgent(null); setEditCodeText(''); setEditStatus(null); setShowSplitView(false) } }
    if (editingAgent) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editingAgent])

  // Helpers from AgentverseFetch (component scope)
  function formatPythonCode(code) {
    if (!code) return ''
    let s = String(code).replace(/\r\n?/g, '\n')
    s = s.replace(/\t/g, '    ')
    s = s.split('\n').map(l => l.replace(/[ \t]+$/g, '')).join('\n')
    s = s.replace(/\n{3,}/g, '\n\n')
    const lines = s.split('\n')
    let importEnd = -1
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line === '' || line.startsWith('#')) continue
      if (line.startsWith('import ') || line.startsWith('from ')) {
        importEnd = i
        continue
      }
      if (importEnd >= 0) {
        if (lines[i-1] && lines[i-1].trim() !== '') {
          lines.splice(i, 0, '')
        }
      }
      break
    }
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i]
      if (/^def\s+\w+\(/.test(l) || /^class\s+\w+/.test(l)) {
        let j = i - 1
        let blankCount = 0
        while (j >= 0 && lines[j].trim() === '') { blankCount++; j-- }
        const needed = 2 - blankCount
        if (needed > 0) {
          const inserts = Array(needed).fill('')
          lines.splice(i, 0, ...inserts)
          i += needed
        }
      }
    }
    while (lines.length && lines[0].trim() === '') lines.shift()
    while (lines.length && lines[lines.length-1].trim() === '') lines.pop()
    return lines.join('\n') + (lines.length ? '\n' : '')
  }

  function pythonToJSON(code) {
    const formatted = formatPythonCode(code)
    return JSON.stringify([{ language: 'python', name: 'agent.py', value: formatted }], null, 2)
  }

  function jsonToPython(jsonStr) {
    function unwrapJSON(data, depth = 0) {
      if (depth > 10) return data
      if (typeof data === 'string') {
        const trimmed = data.trim()
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          try { const parsed = JSON.parse(data); return unwrapJSON(parsed, depth + 1) } catch { return data }
        }
        return data
      }
      if (Array.isArray(data) && data.length > 0) {
        const entry = data.find(e => (e.language && String(e.language).toLowerCase() === 'python') || (e.name && String(e.name).toLowerCase().endsWith('.py'))) || data[0]
        const candidate = entry?.value ?? entry?.content ?? entry?.code
        if (candidate) return unwrapJSON(candidate, depth + 1)
      }
      if (data && data.files && Array.isArray(data.files)) return unwrapJSON(data.files, depth + 1)
      if (data && typeof data === 'object') {
        if (data.value) return unwrapJSON(data.value, depth + 1)
        if (data.code) return unwrapJSON(data.code, depth + 1)
        if (data.content) return unwrapJSON(data.content, depth + 1)
        for (const key of Object.keys(data)) {
          const val = data[key]
          if (typeof val === 'string' && val.trim()) {
            const result = unwrapJSON(val, depth + 1)
            if (result && result !== val) return result
          }
        }
      }
      return typeof data === 'string' ? data : ''
    }
    try { const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr; return unwrapJSON(parsed) } catch { return typeof jsonStr === 'string' ? jsonStr : '' }
  }

  useEffect(() => {
    if (isConnected && address) {
      fetchStats()
    }
    // always try agentverse on mount, independent of wallet
    fetchAgentverseAgents()
    // listen for token changes from Layout panel
    function onTokenChange() {
      fetchAgentverseAgents()
    }
    window.addEventListener('agentverse_token_changed', onTokenChange)
    return () => window.removeEventListener('agentverse_token_changed', onTokenChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address])

  // Simple Python syntax highlighter for inline preview
  function highlightPython(src) {
    if (!src) return ''
    let s = src
      .replace(/[&<>]/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]))
    // comments
    s = s.replace(/(^|\s)#.*$/gm, (m) => `<span class="tok-com">${m}</span>`)
    // strings (single and double, simple)
    s = s.replace(/(["'])((?:\\.|(?!\1).)*)\1/g, (m) => `<span class="tok-str">${m}</span>`)
    // numbers
    s = s.replace(/\b(0x[0-9a-fA-F]+|\d+(?:\.\d+)?)\b/g, '<span class="tok-num">$1</span>')
    // def and class names
    s = s.replace(/\bdef\s+(\w+)/g, 'def <span class="tok-def">$1</span>')
    s = s.replace(/\bclass\s+(\w+)/g, 'class <span class="tok-cls">$1</span>')
    // keywords
    const kw = ['def','class','return','if','elif','else','for','while','try','except','finally','with','as','import','from','yield','lambda','pass','break','continue','in','and','or','not','is','None','True','False']
    const kwRe = new RegExp(`\\b(${kw.join('|')})\\b`, 'g')
    s = s.replace(kwRe, '<span class="tok-kw">$1</span>')
    return s
  }

  // Scroll sync between gutter and code
  function onScrollSync(e) {
    const top = e.target.scrollTop
    const left = e.target.scrollLeft
    if (gutterRef.current) {
      gutterRef.current.scrollTop = top
    }
    if (preRef.current) {
      preRef.current.style.transform = `translate(-${left}px, -${top}px)`
    }
  }

  async function fetchAgentverseAgents() {
    try {
      const token = localStorage.getItem('agentverse_token')
      if (!token) return
      
      setAgentverseLoading(true)
      const res = await fetch('https://agentverse.ai/v1/hosting/agents', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      // Support both {items: [...]} and [...] shapes
      const items = Array.isArray(data) ? data : (data.items || data.agents || [])
      setAgentverseAgents(items)
    } catch (e) {
      console.error(e)
      setAgentverseAgents([])
    } finally {
      setAgentverseLoading(false)
    }
  }

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

  // Mock earnings data
  const totalEarnings = agents.reduce((sum, a) => sum + (a.rentCount * 0.01), 0)
  const totalChats = agents.reduce((sum, a) => sum + a.chatCount, 0)
  const avgScore = agents.length > 0 ? agents.reduce((sum, a) => sum + (a.score || 0), 0) / agents.length : 0

  return (
    <div className="glass card" style={{ padding: 0 }}>
      <div style={{ padding: 24 }}>
        <div className="section-title" style={{ textAlign: 'center' }}>Owner Dashboard</div>
        <>
            {/* Metrics Grid */}
            <div className="metrics-grid">
              <div className="glass metric-card">
                <div className="earnings-meter">
                  <div className="meter-circle">
                    <div className="meter-value">{totalEarnings.toFixed(3)}</div>
                  </div>
                </div>
                <div className="metric-label">Total Earnings (ETH)</div>
              </div>
              
              <div className="glass metric-card">
                <div className="metric-value">{agents.length}</div>
                <div className="metric-label">Active Agents</div>
              </div>
              
              <div className="glass metric-card">
                <div className="metric-value">{totalChats}</div>
                <div className="metric-label">Total Chats</div>
              </div>
              
              <div className="glass metric-card">
                <div className="metric-value">{avgScore.toFixed(1)}</div>
                <div className="metric-label">Avg Score</div>
              </div>
            </div>

            {/* Local Agents */}
            {loading && <p className="muted" style={{ textAlign: 'center' }}>Loading local agents...</p>}
            
            {agents.length > 0 && (
              <>
                <div className="section-title" style={{ fontSize: 20, marginBottom: 16 }}>Local Agents</div>
                <div className="agent-cards">
                  {agents.map((a) => (
                    <div key={a.agentId} className="glass agent-card">
                      <h3>
                        <span>{a.agentId}</span>
                        <small className="muted">{a.domain}</small>
                      </h3>
                      <p className="muted">{a.description}</p>
                      
                      <div className="agent-stats">
                        <div className="agent-stat">
                          <div className="agent-stat-value">{a.score || 0}</div>
                          <div className="agent-stat-label">Score</div>
                        </div>
                        <div className="agent-stat">
                          <div className="agent-stat-value">{a.rentCount}</div>
                          <div className="agent-stat-label">Rents</div>
                        </div>
                        <div className="agent-stat">
                          <div className="agent-stat-value">{a.chatCount}</div>
                          <div className="agent-stat-label">Chats</div>
                        </div>
                      </div>
                      
                      <div className="actions">
                        <button className="btn primary" onClick={() => triggerScore(a.agentId)}>Run Scoring</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Agentverse Agents */}
            {agentverseLoading && <p className="muted" style={{ textAlign: 'center' }}>Loading Agentverse agents...</p>}
            
            {agentverseAgents.length > 0 && (
              <>
                <div className="section-title" style={{ fontSize: 20, marginBottom: 16, marginTop: 32 }}>Agentverse Agents</div>
                <div className="agent-cards">
                  {agentverseAgents.map((a, idx) => (
                    <div key={a.id || a.address || idx} className="glass agent-card">
                      <h3>
                        <span>{a.name || a.id}</span>
                        <small className="muted">{a.domain || 'unknown'}</small>
                      </h3>
                      <p className="muted">{a.short_description || a.readme || a.description || 'No description'}</p>

                      <div className="agent-stats">
                        <div className="agent-stat">
                          <div className="agent-stat-value">{a.running ? 'ON' : 'OFF'}</div>
                          <div className="agent-stat-label">Status</div>
                        </div>
                        <div className="agent-stat">
                          <div className="agent-stat-value">{a.wallet_top_up || '0'}</div>
                          <div className="agent-stat-label">Balance</div>
                        </div>
                        <div className="agent-stat">
                          <div className="agent-stat-value">{a.created_at ? new Date(a.created_at).toLocaleDateString() : '-'}</div>
                          <div className="agent-stat-label">Created</div>
                        </div>
                      </div>

                      <div className="actions">
                        <button className="btn" onClick={() => { setConnectingAgent(a); setSelectedDomain(a.domain || '') }}>Import</button>
                        <button className="btn primary" onClick={async () => {
                          setEditStatus(null)
                          setEditCodeText('')
                          setEditingAgent(a)
                          setShowSplitView(true)
                          const token = (() => { try { return localStorage.getItem('agentverse_token') } catch { return null } })()
                          if (!token) { setEditStatus('No Agentverse token saved — click the key icon to save it.'); return }
                          const addr = a.address || a.id || a.agent_id || a.name
                          if (!addr) { setEditStatus('Could not determine agent address/id to fetch code'); return }
                          try {
                            const res = await fetch(`https://agentverse.ai/v1/hosting/agents/${encodeURIComponent(addr)}/code`, { headers: { Authorization: `Bearer ${token}` } })
                            const j = await res.json()
                            if (!res.ok) { setEditStatus('Failed to fetch code: ' + (j?.error || j?.message || JSON.stringify(j))); return }
                            const extracted = jsonToPython(j) || ''
                            const formatted = formatPythonCode(extracted)
                            setEditCodeText(formatted)
                          } catch (err) { setEditStatus('Fetch code failed: ' + String(err)) }
                        }}>Edit Code</button>
                      </div>

                      {connectingAgent && (connectingAgent.address || connectingAgent.id) === (a.address || a.id) && (
                        <div className="glass card" style={{ marginTop: 12 }}>
                          <div className="actions" style={{ alignItems: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span className="muted">Domain</span>
                              <input value={selectedDomain} onChange={(e) => setSelectedDomain(e.target.value)} placeholder='e.g. finance' />
                            </label>
                            <button className="btn primary" onClick={async () => {
                              try {
                                const agentId = (a.name || a.address || a.id).toString().replace(/\s+/g, '-').toLowerCase()
                                const payload = {
                                  agentId,
                                  name: a.name,
                                  domain: selectedDomain || null,
                                  description: a.short_description || a.readme || '',
                                  manifestUrl: a.manifest_url || a.avatar_url || null,
                                  owner: a.maintainer_id || null,
                                }
                                const res = await fetch('/api/import-agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                                const j = await res.json()
                                if (!res.ok) throw new Error(JSON.stringify(j))
                                setConnectingAgent(null)
                                setSelectedDomain('')
                                alert('Agent imported locally: ' + agentId)
                              } catch (err) { alert('Import failed: ' + String(err)) }
                            }}>Add</button>
                            <button className="btn" onClick={() => { setConnectingAgent(null); setSelectedDomain('') }}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {!agentverseLoading && agentverseAgents.length === 0 && !loading && agents.length === 0 && (
              <div className="glass card">
                <p style={{ margin: 0, textAlign: 'center' }}>No agents found. Upload your first agent to get started!</p>
              </div>
            )}

            {/* Full-screen Modal Editor for Agentverse agent code */}
            {editingAgent && (
              <div className="modal-overlay" onClick={() => { setEditingAgent(null); setEditCodeText(''); setEditStatus(null); setShowSplitView(false) }}>
                <div className="glass modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <div className="section-title" style={{ fontSize: 18, margin: 0 }}>Editing: {editingAgent.name} ({editingAgent.address || editingAgent.id || editingAgent.name})</div>
                    <div className="actions">
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="checkbox" checked={showSplitView} onChange={(e) => setShowSplitView(e.target.checked)} /> Split View
                      </label>
                      <button className="btn" onClick={() => {
                        const formatted = formatPythonCode(editCodeText)
                        setEditCodeText(formatted)
                        setEditStatus('Code formatted')
                      }}>Format</button>
                      <button className="btn" onClick={() => { setEditingAgent(null); setEditCodeText(''); setEditStatus(null); setShowSplitView(false) }}>Close</button>
                    </div>
                  </div>
                  <div className="modal-body">
                    {editStatus && <div className="muted" style={{ marginBottom: 8 }}>{editStatus}</div>}
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: showSplitView ? 1 : 2, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Python Code</div>
                        <div className="code-editor">
                          <div className="code-gutter" ref={gutterRef}>
                            {editCodeText.split('\n').map((_, i) => (
                              <div key={i}>{i + 1}</div>
                            ))}
                          </div>
                          <div className="code-scroller" ref={scrollerRef}>
                            <pre className="code-pre" ref={preRef} dangerouslySetInnerHTML={{ __html: highlightPython(editCodeText) }} />
                            <textarea
                              className="code-input"
                              value={editCodeText}
                              onChange={(e) => setEditCodeText(e.target.value)}
                              onScroll={onScrollSync}
                            />
                          </div>
                        </div>
                      </div>
                      {showSplitView && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <div style={{ fontWeight: 700, marginBottom: 6 }}>JSON Format (Preview)</div>
                          <textarea rows={18} readOnly value={pythonToJSON(editCodeText)} style={{ width: '100%' }} />
                        </div>
                      )}
                    </div>
                    <div className="actions" style={{ marginTop: 12 }}>
                      <button className="btn primary" onClick={async () => {
                        setEditSaving(true)
                        setEditStatus(null)
                        try {
                          const token = (() => { try { return localStorage.getItem('agentverse_token') } catch { return null } })()
                          if (!token) { setEditStatus('No token saved'); setEditSaving(false); return }
                          const addr = editingAgent.address || editingAgent.id || editingAgent.name
                          const formatted = formatPythonCode(editCodeText)
                          const payload = [{ language: 'python', name: 'agent.py', value: formatted }]
                          const res = await fetch(`https://agentverse.ai/v1/hosting/agents/${encodeURIComponent(addr)}/code`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
                          const j = await res.json()
                          if (!res.ok) setEditStatus('Save failed: ' + (j?.error || j?.message || JSON.stringify(j)))
                          else setEditStatus('Code saved successfully')
                        } catch (err) { setEditStatus('Save failed: ' + String(err)) }
                        finally { setEditSaving(false) }
                      }} disabled={editSaving}>{editSaving ? 'Saving...' : 'Save to Agentverse'}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </>
      </div>
    </div>
  )
}
