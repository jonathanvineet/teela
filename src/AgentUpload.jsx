import { useState } from 'react'

const TRACKS = [
  { id: 'legal', name: 'Legal Advisor' },
  { id: 'finance', name: 'Financial Advisor' },
  { id: 'medical', name: 'Medical Advisor' },
  { id: 'real-estate', name: 'Real Estate Advisor' },
  { id: 'hr', name: 'HR / Recruitment' },
  { id: 'compliance', name: 'Compliance & Privacy' }
]

// Minimal Agent upload form aligned with Agentverse "create user agent" intent.
// Only ask for fields required to create a user agent. Validate required fields and
// POST a minimal JSON payload to /api/agent-upload. Any additional server-side
// validation/errors are shown to the user.
export default function AgentUpload() {
  const [agentId, setAgentId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [domain, setDomain] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [modelUrl, setModelUrl] = useState('')
  const [price, setPrice] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [postUploadAgent, setPostUploadAgent] = useState(null)
  const [showCodeEditor, setShowCodeEditor] = useState(false)
  const [codeText, setCodeText] = useState('')
  const [savingCode, setSavingCode] = useState(false)
  const [codeSaveStatus, setCodeSaveStatus] = useState(null)

  // Only name is required by Agentverse's Create User Agent API.
  // All other fields are optional. Build a minimal payload containing only
  // provided fields so that POST body is compact (e.g. { name: 'foo' }).
  function validate() {
    if (!name || String(name).trim() === '') return 'Agent name is required.'
    return null
  }

  async function handleUpload(e) {
    e.preventDefault()
    setStatus(null)
    const err = validate()
    if (err) {
      setStatus(err)
      return
    }

    // Only include keys that have values. Agentverse requires only `name`.
    const payload = { name: String(name).trim() }
    if (agentId && String(agentId).trim() !== '') payload.agentId = String(agentId).trim()
    if (description && String(description).trim() !== '') payload.readme = String(description).trim()
    const computedDomain = domain === '__other' ? (customDomain || '') : domain || ''
    if (computedDomain) payload.domain = computedDomain
    if (modelUrl && String(modelUrl).trim() !== '') payload.manifest_url = String(modelUrl).trim()
    if (price && String(price).trim() !== '') payload.price = String(price).trim()
    if (contactEmail && String(contactEmail).trim() !== '') payload.contact_email = String(contactEmail).trim()

    setLoading(true)
    try {
      // If the user has an Agentverse token saved in localStorage, POST to Agentverse
      // directly using the minimal payload (Agentverse requires only `name`).
      const agentverseToken = (() => {
        try { return localStorage.getItem('agentverse_token') } catch { return null }
      })()

      if (agentverseToken) {
        const res = await fetch('https://agentverse.ai/v1/hosting/agents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${agentverseToken}`
          },
          body: JSON.stringify(payload)
        })
        const json = await res.json()
        if (!res.ok) {
          const msg = json?.error || json?.message || JSON.stringify(json)
          setStatus('Upload failed (Agentverse): ' + msg)
        } else {
          setStatus('Upload successful (Agentverse): ' + (json?.message || JSON.stringify(json)))
          // store agent info and show inline code editor. Populate editor with
          // returned code if the response included it; otherwise leave empty so
          // the user can paste their agent code.
          setPostUploadAgent(json)
          setCodeText(json && (json.code !== undefined && json.code !== null) ? json.code : '')
          setShowCodeEditor(true)
        }
      } else {
        // No Agentverse token: fall back to local backend. Note: local /api/agent-upload expects
        // multipart/form-data with files and an agentId form field. For simple JSON-based creation
        // prefer saving a token in the Owner Dashboard and retrying.
        const res = await fetch('/api/agent-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const json = await res.json()
        if (!res.ok) {
          const msg = json?.error || JSON.stringify(json)
          setStatus('Upload failed (local): ' + msg + ' — note: local upload expects files and agentId form fields')
        } else {
          setStatus('Upload successful (local): ' + (json?.message || JSON.stringify(json)))
        }
      }
    } catch (e) {
      setStatus('Upload failed: ' + String(e))
    } finally {
      setLoading(false)
    }
  }

  // helper to extract an agent identifier/address from Agentverse response
  function _agentAddressFromResponse(json) {
    if (!json) return null
    if (typeof json === 'string') return json
    if (json.address) return json.address
    if (json.id) return json.id
    if (json.agent && (json.agent.address || json.agent.id)) return json.agent.address || json.agent.id
    // some responses nest under data
    if (json.data && (json.data.address || json.data.id)) return json.data.address || json.data.id
    return null
  }

  // Lightweight Python formatter (same heuristic used in Owner dashboard):
  // - normalize line endings
  // - replace tabs with 4 spaces
  // - trim trailing spaces
  // - collapse excessive blank lines
  // - ensure a blank line after imports and two blank lines before top-level defs/classes
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

  async function saveCodeToAgent() {
    setCodeSaveStatus(null)
    setSavingCode(true)
    try {
      const token = (() => { try { return localStorage.getItem('agentverse_token') } catch { return null } })()
      if (!token) {
        setCodeSaveStatus('No Agentverse token found. Save a token in Owner Dashboard first.')
        setSavingCode(false)
        return
      }
      const addr = _agentAddressFromResponse(postUploadAgent)
      if (!addr) {
        setCodeSaveStatus('Could not determine agent address from upload response. Please paste the agent address.')
        setSavingCode(false)
        return
      }
      const url = `https://agentverse.ai/v1/hosting/agents/${encodeURIComponent(addr)}/code`
      // Format the code before sending
      const formatted = formatPythonCode ? formatPythonCode(codeText) : String(codeText || '')
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: String(formatted || '') })
      })
      const j = await res.json()
      if (!res.ok) {
        setCodeSaveStatus('Save failed: ' + (j?.error || j?.message || JSON.stringify(j)))
      } else {
        setCodeSaveStatus('Code saved successfully')
      }
    } catch (e) {
      setCodeSaveStatus('Save failed: ' + String(e))
    } finally {
      setSavingCode(false)
    }
  }

  return (
    <div className="glass card" style={{ padding: 0 }}>
      <div style={{ padding: 24 }}>
        <div className="section-title">Create / Upload Agent</div>
        <form onSubmit={handleUpload} className="form">
          <div className="form-grid">
            <label>
              <span>Agent ID (slug) — optional</span>
              <input value={agentId} onChange={(e) => setAgentId(e.target.value)} placeholder='financial-advisor (optional)' />
            </label>

            <label>
              <span>Name — required</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder='Financial Advisor' />
            </label>

            <label>
              <span>Short description</span>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder='Short description' />
            </label>

            <label>
              <span>Domain / Track</span>
              <select value={domain || ''} onChange={(e) => setDomain(e.target.value)}>
                <option value=''>-- none --</option>
                {TRACKS.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
                <option value='__other'>Other (enter below)</option>
              </select>
            </label>

            {domain === '__other' && (
              <label>
                <span>Custom domain</span>
                <input value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder='e.g. gaming, education' />
              </label>
            )}

            <label>
              <span>Model / Manifest URL — optional</span>
              <input value={modelUrl} onChange={(e) => setModelUrl(e.target.value)} placeholder='https://.../manifest.json or model entrypoint (optional)' />
            </label>

            <label>
              <span>Price (optional) — e.g. 0.01 (ETH)</span>
              <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder='0.01' />
            </label>

            <label>
              <span>Contact email (optional)</span>
              <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder='owner@example.com' />
            </label>
          </div>

          <div className="actions">
            <button type='submit' disabled={loading}>{loading ? 'Uploading...' : 'Upload Agent'}</button>
            <button type='button' onClick={() => {
              setAgentId('')
              setName('')
              setDescription('')
              setDomain('')
              setCustomDomain('')
              setModelUrl('')
              setPrice('')
              setContactEmail('')
              setStatus(null)
            }}>Clear</button>
          </div>

          {status && <pre style={{ whiteSpace: 'pre-wrap' }}>{status}</pre>}

          {/* Inline code editor shown after successful Agentverse upload */}
          {showCodeEditor && (
            <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 12 }}>
              <h3>Edit agent code</h3>
              <div className="muted" style={{ marginBottom: 8 }}>Paste your agent code below and click Save Code — this will PUT to Agentverse's /v1/hosting/agents/:address/code endpoint.</div>
              <textarea rows={12} value={codeText} onChange={(e) => setCodeText(e.target.value)} placeholder={'Paste agent code here'} style={{ width: '100%' }} />
              <div className="actions" style={{ marginTop: 8 }}>
                <button onClick={saveCodeToAgent} disabled={savingCode}>{savingCode ? 'Saving...' : 'Save Code'}</button>
                <button onClick={() => { setShowCodeEditor(false); setCodeText(''); setPostUploadAgent(null); setCodeSaveStatus(null) }}>Close</button>
              </div>
              {codeSaveStatus && <div style={{ marginTop: 8 }}>{codeSaveStatus}</div>}
              <div className="muted" style={{ marginTop: 8 }}>
                Agent identifier: {_agentAddressFromResponse(postUploadAgent) || 'unknown — please check Agentverse response'}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
