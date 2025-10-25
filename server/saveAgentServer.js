import express from 'express'
import fs from 'fs'
import path from 'path'
import cors from 'cors'
import process from 'node:process'
import { spawn } from 'node:child_process'

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))

const projectRoot = path.resolve(process.cwd())
const agentsDir = path.join(projectRoot, 'agents')
const indexFile = path.join(agentsDir, 'agents_registry.json')
const procs = new Map() // key: file path -> { proc, logs:[], running:boolean, startedAt:number, exited:number|null, code:number|null }
const MAX_LOG_LINES = 1000

// Manage teela.py background process
let teelaState = { proc: null, running: false }

// NOTE: pythonInterpreter is defined above for teela management and reused here

function ensureTeelaRunning() {
  if (teelaState.running) return teelaState
  try {
    const py = pythonInterpreter()
    const teelaPath = path.join(projectRoot, 'agents', 'teela.py')
    if (!fs.existsSync(teelaPath)) { console.warn('[teela] missing agents/teela.py'); return teelaState }
    const child = spawn(py, [teelaPath], { cwd: projectRoot, env: process.env })
    teelaState = { proc: child, running: true }
    child.on('close', (code) => { teelaState.running = false; console.log(`[teela] exited with code ${code}`) })
    child.stdout.on('data', (d) => process.stdout.write(`[teela] ${d}`))
    child.stderr.on('data', (d) => process.stderr.write(`[teela] ${d}`))
    console.log('[teela] started')
  } catch (e) {
    console.error('[teela] failed to start:', e)
  }
  return teelaState
}

function ensureDirs() {
  if (!fs.existsSync(agentsDir)) fs.mkdirSync(agentsDir, { recursive: true })
  if (!fs.existsSync(indexFile)) {
    fs.writeFileSync(indexFile, JSON.stringify({ domain: {} }, null, 2))
  }
}

function loadIndex() {
  ensureDirs()
  try { return JSON.parse(fs.readFileSync(indexFile, 'utf8') || '{"domain":{}}') } catch { return { domain: {} } }
}

function saveIndex(idx) {
  fs.writeFileSync(indexFile, JSON.stringify(idx, null, 2))
}

app.post('/api/save-agent-project', (req, res) => {
  try {
    const { domain, speciality = '', agent, file, code } = req.body || {}
    if (!domain || !agent || !file || !code) {
      return res.status(400).json({ error: 'Missing domain/agent/file/code' })
    }
    const safeFile = String(file).replace(/[^a-zA-Z0-9._-]/g, '_')
    ensureDirs()
    // Write code file
    const filepath = path.join(agentsDir, safeFile)
    fs.writeFileSync(filepath, String(code))

    // Update index
    const idx = loadIndex()
    if (!idx.domain) idx.domain = {}
    if (!idx.domain[domain]) idx.domain[domain] = { agents: [] }

    const entryBase = {
      agent_id: agent.agent_id || agent.id || agent.name || path.basename(safeFile, '.py'),
      name: agent.name || agent.agent_id || 'agent',
      address: agent.address || '',
      status: agent.status || 'active',
      speciality,
      file: `agents/${safeFile}`,
      wallet: agent.wallet || '',
      imported_at: new Date().toISOString(),
      connected: false,
    }

    // Upsert by agent_id
    const list = idx.domain[domain].agents
    const i = list.findIndex(a => a.agent_id === entryBase.agent_id)
    if (i >= 0) list[i] = entryBase
    else list.push(entryBase)

    saveIndex(idx)

    res.json({ ok: true, file: `agents/${safeFile}`, domain, agent: entryBase })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: String(e) })
  }
})

function pythonInterpreter() {
  const venvPy = path.join(projectRoot, '.venv', 'bin', 'python')
  try { if (fs.existsSync(venvPy)) return venvPy } catch (e) { console.error('venv check failed:', e) }
  return 'python3'
}

function sanitizeRelFile(rel) {
  const safe = String(rel || '').replace(/\\/g, '/').replace(/[^a-zA-Z0-9._/-]/g, '_')
  if (safe.includes('..')) throw new Error('Invalid file path')
  return safe
}

function tailLogs(arr, n = 400) {
  if (!Array.isArray(arr)) return []
  return arr.length > n ? arr.slice(arr.length - n) : arr
}

app.post('/api/run-agent', (req, res) => {
  try {
    const { file } = req.body || {}
    if (!file) return res.status(400).json({ error: 'file required' })
    const rel = sanitizeRelFile(file.startsWith('agents/') ? file.slice('agents/'.length) : file)
    const full = path.join(agentsDir, rel)
    if (!fs.existsSync(full)) return res.status(404).json({ error: 'file not found' })

    // Stop existing if running
    const existing = procs.get(full)
    if (existing?.running) {
      try { existing.proc.kill('SIGTERM') } catch (e) { console.error('kill failed:', e) }
    }

    const py = pythonInterpreter()
    const child = spawn(py, [full], { cwd: projectRoot, env: process.env })
    const state = { proc: child, logs: [], running: true, startedAt: Date.now(), exited: null, code: null }
    procs.set(full, state)

    const push = (line) => {
      state.logs.push(line)
      if (state.logs.length > MAX_LOG_LINES) state.logs.splice(0, state.logs.length - MAX_LOG_LINES)
    }
    child.stdout.on('data', (d) => push(String(d)))
    child.stderr.on('data', (d) => push(String(d)))
    child.on('close', (code) => { state.running = false; state.code = code; state.exited = Date.now(); push(`\n[process exited with code ${code}]\n`) })

    return res.json({ ok: true, pid: child.pid, file: `agents/${rel}` })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: String(e) })
  }
})

app.post('/api/stop-agent', (req, res) => {
  try {
    const { file } = req.body || {}
    if (!file) return res.status(400).json({ error: 'file required' })
    const rel = sanitizeRelFile(file.startsWith('agents/') ? file.slice('agents/'.length) : file)
    const full = path.join(agentsDir, rel)
    const st = procs.get(full)
    if (!st || !st.running) return res.json({ ok: true, stopped: false })
    try { st.proc.kill('SIGTERM') } catch (e) { console.error('kill failed:', e) }
    return res.json({ ok: true, stopped: true })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: String(e) })
  }
})

app.get('/api/agent-logs', (req, res) => {
  try {
    const file = req.query.file
    if (!file) return res.status(400).json({ error: 'file required' })
    const rel = sanitizeRelFile(String(file).startsWith('agents/') ? String(file).slice('agents/'.length) : String(file))
    const full = path.join(agentsDir, rel)
    const st = procs.get(full)
    if (!st) return res.json({ running: false, logs: [], code: null })
    return res.json({ running: st.running, code: st.code, logs: tailLogs(st.logs) })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: String(e) })
  }
})

app.get('/api/imported-agents', (req, res) => {
  try {
    const wallet = req.query.wallet
    if (!wallet) return res.status(400).json({ error: 'wallet address required' })
    
    const idx = loadIndex()
    const allAgents = []
    
    // Collect all agents from all domains that match the wallet
    Object.keys(idx.domain || {}).forEach(domain => {
      const domainAgents = idx.domain[domain]?.agents || []
      domainAgents.forEach(agent => {
        if (agent.wallet === wallet) {
          allAgents.push({ ...agent, domain })
        }
      })
    })
    
    return res.json({ agents: allAgents })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: String(e) })
  }
})

app.post('/api/update-agent-connection', (req, res) => {
  try {
    const { agent_id, connected, wallet } = req.body || {}
    if (!agent_id || typeof connected !== 'boolean' || !wallet) {
      return res.status(400).json({ error: 'Missing agent_id, connected status, or wallet' })
    }
    
    const idx = loadIndex()
    let updated = false
    
    // Find and update the agent across all domains
    Object.keys(idx.domain || {}).forEach(domain => {
      const agents = idx.domain[domain]?.agents || []
      const agentIndex = agents.findIndex(a => a.agent_id === agent_id && a.wallet === wallet)
      if (agentIndex >= 0) {
        agents[agentIndex].connected = connected
        updated = true
      }
    })
    
    if (!updated) {
      return res.status(404).json({ error: 'Agent not found' })
    }
    
    saveIndex(idx)
    return res.json({ ok: true, agent_id, connected })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: String(e) })
  }
})

// --- Simple proxy to TEELA HTTP bridge ---
app.post('/api/teela-chat', async (req, res) => {
  try {
    const { message } = req.body || {}
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message required' })
    }
    ensureTeelaRunning()
    const resp = await fetch('http://127.0.0.1:8010/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    })
    const json = await resp.json().catch(() => ({}))
    if (!resp.ok) return res.status(500).json({ error: json.error || 'teela bridge error' })
    return res.json({ reply: json.reply || '' })
  } catch (e) {
    console.error('[teela-proxy] error', e)
    return res.status(500).json({ error: String(e) })
  }
})

const port = process.env.SAVE_AGENT_PORT || 5002
app.listen(port, () => {
  console.log(`[saveAgentServer] listening on :${port}`)
  // Best-effort start of TEELA so npm run dev auto boots it
  ensureTeelaRunning()
})

// Export for testing
export default app
