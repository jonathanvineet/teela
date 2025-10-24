/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react'

export default function AgentverseFetch() {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [agents, setAgents] = useState([])
  const [connectingAgent, setConnectingAgent] = useState(null)
  const [selectedDomain, setSelectedDomain] = useState('')
  const [connected, setConnected] = useState(false)
  const [editingAgent, setEditingAgent] = useState(null)
  const [editCodeText, setEditCodeText] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editStatus, setEditStatus] = useState(null)
  const [showSplitView, setShowSplitView] = useState(false)

  // Lightweight Python formatter
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

  // Convert Python code to Agentverse JSON format
  function pythonToJSON(code) {
    const formatted = formatPythonCode(code)
    return JSON.stringify([{
      language: "python",
      name: "agent.py",
      value: formatted
    }], null, 2)
  }

  // Convert JSON back to Python code
  function jsonToPython(jsonStr) {
    if (!jsonStr && jsonStr !== '') return ''

    // Recursively unwrap JSON strings until we get to actual Python code
    function unwrapJSON(data, depth = 0) {
      if (depth > 10) return data // Prevent infinite recursion

      // If it's a string that looks like JSON, try to parse it
      if (typeof data === 'string') {
        const trimmed = data.trim()
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          try {
            const parsed = JSON.parse(data)
            return unwrapJSON(parsed, depth + 1)
          } catch (e) {
            // Not valid JSON, return as-is (probably Python code)
            return data
          }
        }
        return data
      }

      // If it's an array, check the first element
      if (Array.isArray(data) && data.length > 0) {
        const entry = data.find(e => 
          (e.language && String(e.language).toLowerCase() === 'python') || 
          (e.name && String(e.name).toLowerCase().endsWith('.py'))
        ) || data[0]

        const candidate = entry?.value ?? entry?.content ?? entry?.code
        if (candidate) return unwrapJSON(candidate, depth + 1)
      }

      // If it's an object with a files array
      if (data && data.files && Array.isArray(data.files)) {
        return unwrapJSON(data.files, depth + 1)
      }

      // If it's an object, check for value/code/content fields
      if (data && typeof data === 'object') {
        if (data.value) return unwrapJSON(data.value, depth + 1)
        if (data.code) return unwrapJSON(data.code, depth + 1)
        if (data.content) return unwrapJSON(data.content, depth + 1)

        // Check all string fields for potential JSON
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

    try {
      const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr
      return unwrapJSON(parsed)
    } catch (e) {
      // If parsing fails, it might already be Python code
      return typeof jsonStr === 'string' ? jsonStr : ''
    }
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem('agentverse_token')
      if (saved) {
        setToken(saved)
        setConnected(true)
      }
    } catch (e) {
      // ignore
    }
  }, [])

  async function fetchAgents() {
    setError(null)
    setLoading(true)
    setAgents([])
    try {
      const res = await fetch('https://agentverse.ai/v1/hosting/agents', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Agentverse responded ${res.status}: ${text}`)
      }
      const data = await res.json()
      setAgents(data.items || [])
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 12, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <h3>Agentverse — Connect & Fetch</h3>
      <p style={{ color: '#666', marginBottom: 12 }}>Store your Agentverse API token. Use Fetch to load hosted agents.</p>

      {/* Token controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <input
          type='password'
          placeholder='Agentverse API token'
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{ flex: 1 }}
        />
        <button onClick={() => {
          try {
            if (!token) return setError('Enter a token to save')
            localStorage.setItem('agentverse_token', token)
            setConnected(true)
            setError(null)
          } catch (e) {
            setError('Could not save token: ' + String(e))
          }
        }} disabled={!token}>Save</button>
        <button onClick={() => { localStorage.removeItem('agentverse_token'); setConnected(false); setToken(''); setAgents([]); setError(null) }} disabled={!connected && !token}>Disconnect</button>
        <div style={{ marginLeft: 8, color: connected ? 'green' : '#666' }}>{connected ? 'Connected' : 'Not connected'}</div>
      </div>

      {error && <div style={{ color: 'red', marginBottom: 8 }}>Error: {error}</div>}

      {/* Fetch controls */}
      <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
        <button onClick={fetchAgents} disabled={loading || !token}>{loading ? 'Fetching...' : 'Fetch Agents'}</button>
        <div style={{ color: '#666', alignSelf: 'center' }}>{token ? 'Using provided token' : 'No token provided'}</div>
      </div>

      {/* Agent list or editor */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {!editingAgent ? (
          agents.length === 0 ? (
            <div style={{ color: '#666' }}>No agents loaded.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {agents.map((a) => (
                <div key={a.address + (a.name||'')} style={{ border: '1px solid #eee', padding: 8, borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{a.name}</strong> <small style={{ color: '#666' }}>{a.domain || ''}</small>
                      <div style={{ color: '#444' }}>{a.short_description || a.readme || ''}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12 }}>{a.address}</div>
                      <div style={{ color: a.running ? 'green' : '#999', fontSize: 12 }}>{a.running ? 'running' : 'stopped'}</div>
                      <div style={{ marginTop: 8 }}>
                        <button onClick={() => { setConnectingAgent(a); setSelectedDomain(a.domain || '') }}>Connect</button>
                        <button style={{ marginLeft: 8 }} onClick={async () => {
                          setEditStatus(null)
                          setEditCodeText('')
                          setEditingAgent(a)
                          setShowSplitView(true)
                          const token = (() => { try { return localStorage.getItem('agentverse_token') } catch { return null } })()
                          if (!token) {
                            setEditStatus('No Agentverse token saved — save it at the top first.')
                            return
                          }
                          const addr = a.address || a.id || a.agent_id || a.name
                          if (!addr) { setEditStatus('Could not determine agent address/id to fetch code'); return }
                          try {
                            const res = await fetch(`https://agentverse.ai/v1/hosting/agents/${encodeURIComponent(addr)}/code`, { headers: { Authorization: `Bearer ${token}` } })
                            const j = await res.json()
                            if (!res.ok) { setEditStatus('Failed to fetch code: ' + (j?.error || j?.message || JSON.stringify(j))); return }
                            // Extract python source from the Agentverse response, then format it
                            const extracted = jsonToPython(j) || ''
                            const formatted = formatPythonCode(extracted)
                            setEditCodeText(formatted)
                          } catch (err) {
                            setEditStatus('Fetch code failed: ' + String(err))
                          }
                        }}>Edit Code</button>
                      </div>
                    </div>
                  </div>
                  {connectingAgent && connectingAgent.address === a.address && (
                    <div style={{ marginTop: 8, padding: 8, borderTop: '1px dashed #eee' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <label style={{ fontSize: 13 }}>Domain:</label>
                        <input value={selectedDomain} onChange={(e) => setSelectedDomain(e.target.value)} placeholder='domain (e.g. finance)' />
                        <button onClick={async () => {
                          try {
                            const agentId = (a.name || a.address).toString().replace(/\s+/g, '-').toLowerCase()
                            const payload = {
                              agentId: agentId,
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
                          } catch (err) {
                            alert('Import failed: ' + String(err))
                          }
                        }}>Add</button>
                        <button onClick={() => { setConnectingAgent(null); setSelectedDomain('') }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          /* Split-screen editor */
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
              <div>
                <strong>Editing:</strong> {editingAgent.name} ({editingAgent.address || editingAgent.id || editingAgent.name})
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input type="checkbox" checked={showSplitView} onChange={(e) => setShowSplitView(e.target.checked)} />
                  Split View
                </label>
                <button onClick={async () => {
                  setEditSaving(true)
                  setEditStatus(null)
                  try {
                    const token = (() => { try { return localStorage.getItem('agentverse_token') } catch { return null } })()
                    if (!token) { setEditStatus('No token saved'); setEditSaving(false); return }
                    const addr = editingAgent.address || editingAgent.id || editingAgent.name
                    const formatted = formatPythonCode(editCodeText)
                    
                    // Create the JSON array format that Agentverse expects
                    const payload = [{
                      language: "python",
                      name: "agent.py",
                      value: formatted
                    }]
                    
                    const res = await fetch(`https://agentverse.ai/v1/hosting/agents/${encodeURIComponent(addr)}/code`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify(payload)
                    })
                    const j = await res.json()
                    if (!res.ok) setEditStatus('Save failed: ' + (j?.error || j?.message || JSON.stringify(j)))
                    else setEditStatus('✅ Code saved successfully')
                  } catch (err) {
                    setEditStatus('Save failed: ' + String(err))
                  } finally {
                    setEditSaving(false)
                  }
                }} disabled={editSaving}>{editSaving ? 'Saving...' : 'Save to Agentverse'}</button>
                <button onClick={() => {
                  const formatted = formatPythonCode(editCodeText)
                  setEditCodeText(formatted)
                  setEditStatus('✨ Code formatted')
                }}>Format</button>
                <button onClick={() => { setEditingAgent(null); setEditCodeText(''); setEditStatus(null); setShowSplitView(false) }}>Close</button>
              </div>
            </div>
            
            {editStatus && <div style={{ padding: 8, marginBottom: 8, background: editStatus.includes('✅') ? '#d4edda' : '#f8d7da', color: editStatus.includes('✅') ? '#155724' : '#721c24', borderRadius: 4 }}>{editStatus}</div>}
            
            <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>
              {/* Python Editor */}
              <div style={{ flex: showSplitView ? 1 : 2, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 14 }}>Python Code</div>
                <textarea 
                  style={{ 
                    flex: 1, 
                    fontFamily: 'monospace', 
                    fontSize: 13, 
                    padding: 8,
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    resize: 'none'
                  }} 
                  value={editCodeText} 
                  onChange={(e) => setEditCodeText(e.target.value)} 
                  placeholder="Paste your Python agent code here..."
                />
              </div>
              
              {/* JSON Preview */}
              {showSplitView && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 14 }}>JSON Format (Live Preview)</div>
                  <textarea 
                    readOnly
                    style={{ 
                      flex: 1, 
                      fontFamily: 'monospace', 
                      fontSize: 13, 
                      padding: 8,
                      border: '1px solid #ddd',
                      borderRadius: 4,
                      background: '#f9f9f9',
                      resize: 'none'
                    }} 
                    value={pythonToJSON(editCodeText)}
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(pythonToJSON(editCodeText))
                      setEditStatus('📋 JSON copied to clipboard')
                    }}
                    style={{ marginTop: 8 }}
                  >
                    Copy JSON
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}