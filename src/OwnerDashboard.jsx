import { useState, useEffect, useRef } from 'react'
import { useAccount, useWriteContract, useReadContract, usePublicClient } from 'wagmi'
import TiltedCard from './TiltedCard'
import BanterLoader from './BanterLoader'
import { AGENT_REGISTRY_ADDRESS, AGENT_REGISTRY_ABI } from './contracts/AgentRegistry'
import { AGENT_SCORING_ADDRESS, AGENT_SCORING_ABI } from './contracts/AgentScoring'
import gsap from 'gsap'

export default function OwnerDashboard() {
  const { address, isConnected } = useAccount()
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
  const [runFile, setRunFile] = useState(null)
  const [runRunning, setRunRunning] = useState(false)
  const [runLogs, setRunLogs] = useState([])
  const logPollRef = useRef(null)
  const [importedAgents, setImportedAgents] = useState([])
  const { writeContract } = useWriteContract()
  const [connectingMap, setConnectingMap] = useState({})
  const [isImporting, setIsImporting] = useState(false)
  const [importMessage, setImportMessage] = useState('')
  const [agentScores, setAgentScores] = useState({})
  const [loadingScores, setLoadingScores] = useState(false)
  const publicClient = usePublicClient()
  const cardRefs = useRef([])

  // Animate agent cards on mount
  useEffect(() => {
    if (importedAgents.length > 0 && cardRefs.current.length > 0) {
      gsap.fromTo(
        cardRefs.current,
        {
          opacity: 0,
          y: 30,
          scale: 0.95
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out'
        }
      )
    }
  }, [importedAgents.length])

  // Fetch agent scores from Envio GraphQL
  useEffect(() => {
    async function fetchScores() {
      if (!importedAgents.length) return
      
      setLoadingScores(true)
      try {
        // Use Envio GraphQL endpoint
        const ENVIO_URL = import.meta.env.VITE_ENVIO_URL || 'http://localhost:8080/v1/graphql'
        
        const query = `
          query GetScores {
            AgentScoring_ScoreRecorded {
              id
              agentId
              score
              revenue
            }
          }
        `
        
        const response = await fetch(ENVIO_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        })
        
        const data = await response.json()
        
        if (data.data && data.data.AgentScoring_ScoreRecorded) {
          const scores = data.data.AgentScoring_ScoreRecorded
          console.log('✅ Loaded scores from Envio:', scores.length, 'events')
          
          // Aggregate scores by agentId
          const scoresMap = {}
          scores.forEach(event => {
            const agentId = event.agentId
            if (!scoresMap[agentId]) {
              scoresMap[agentId] = {
                totalScore: 0,
                sessionCount: 0,
                averageScore: 0,
                totalRevenue: 0,
              }
            }
            scoresMap[agentId].totalScore += Number(event.score)
            scoresMap[agentId].sessionCount += 1
            scoresMap[agentId].totalRevenue += Number(event.revenue) / 1e18
          })
          
          // Calculate averages
          Object.keys(scoresMap).forEach(agentId => {
            scoresMap[agentId].averageScore = Math.round(
              scoresMap[agentId].totalScore / scoresMap[agentId].sessionCount
            )
          })
          
          setAgentScores(scoresMap)
        } else {
          console.log('✅ Loaded scores from Envio: 0 events')
        }
      } catch (error) {
        // Silently fallback to direct contract calls
        await fetchScoresFromContract()
      } finally {
        setLoadingScores(false)
      }
    }
    
    // Direct contract calls
    async function fetchScoresFromContract() {
      if (!publicClient) return
      
      const scores = {}
      
      for (const agent of importedAgents) {
        try {
          const result = await publicClient.readContract({
            address: AGENT_SCORING_ADDRESS,
            abi: AGENT_SCORING_ABI,
            functionName: 'getAgentScore',
            args: [agent.agent_id]
          })
          
          scores[agent.agent_id] = {
            totalScore: result[0],
            sessionCount: result[1],
            averageScore: result[2],
            totalRevenue: result[3]
          }
        } catch (err) {
          console.error(`Failed to fetch score for ${agent.agent_id}:`, err)
        }
      }
      
      setAgentScores(scores)
    }
    
    fetchScores()
  }, [importedAgents, publicClient])

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

  // Save code to both project and Agentverse
  async function saveToProject() {
    try {
      if (!editingAgent) { setEditStatus('No agent selected'); return }
      const code = editCodeText || ''
      if (!code.trim()) { setEditStatus('No code to save'); return }
      const defaultDomain = (editingAgent.domain || selectedDomain || '').trim()
      const domain = window.prompt('Enter domain for this agent', defaultDomain || 'financial')
      if (domain === null) return
      const speciality = window.prompt("What's this agent's speciality? (e.g., portfolio advice)", '') || ''
      const name = editingAgent.name || editingAgent.id || editingAgent.address || 'agent'
      const agentAddress = editingAgent.address || editingAgent.id || ''
      const agent_id = String(name).toLowerCase().replace(/\s+/g, '-')
      const file = `${agent_id}.py`
      
      // Include wallet address for tracking
      const payload = { 
        domain, 
        speciality, 
        agent: { agent_id, name, address: agentAddress, status: 'active', wallet: address }, 
        file, 
        code 
      }
      
      setEditStatus('Saving to project and Agentverse...')
      
      // Save to project
      const res = await fetch('http://localhost:5002/api/save-agent-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setEditStatus('Save to project failed: ' + (j?.error || res.status)); return }
      
      // Also save to Agentverse
      try {
        const token = (() => { try { return localStorage.getItem('agentverse_token') } catch { return null } })()
        if (token) {
          const addr = editingAgent.address || editingAgent.id || editingAgent.name
          const formatted = formatPythonCode(code)
          const agentversePayload = [{ language: 'python', name: 'agent.py', value: formatted }]
          const agentverseRes = await fetch(`https://agentverse.ai/v1/hosting/agents/${encodeURIComponent(addr)}/code`, { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
            body: JSON.stringify(agentversePayload) 
          })
          if (agentverseRes.ok) {
            setEditStatus(`Saved to project and Agentverse: agents/${file} • domain: ${domain}`)
          } else {
            setEditStatus(`Saved to project: agents/${file} • domain: ${domain} (Agentverse save failed)`)
          }
        } else {
          setEditStatus(`Saved to project: agents/${file} • domain: ${domain} (No Agentverse token)`)
        }
      } catch (agentverseError) {
        setEditStatus(`Saved to project: agents/${file} • domain: ${domain} (Agentverse error: ${agentverseError})`)
      }
      
      // auto-run after save
      const relFile = `agents/${file}`
      setRunFile(relFile)
      await startRun(relFile)
      
      // Update the agent in state if it exists
      setImportedAgents(prev => prev.map(a => 
        a.file === `agents/${file}` ? { ...a, speciality, domain } : a
      ))
    } catch (e) {
      setEditStatus('Save error: ' + String(e))
    }
  }

  async function startRun(file) {
    try {
      setRunRunning(true)
      setRunLogs([])
      // stop any existing polling
      if (logPollRef.current) { clearInterval(logPollRef.current); logPollRef.current = null }
      const res = await fetch('http://localhost:5002/api/run-agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file }) })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setEditStatus('Run failed: ' + (j?.error || res.status)); setRunRunning(false); return }
      // start polling logs
      logPollRef.current = setInterval(async () => {
        try {
          const lr = await fetch(`http://localhost:5002/api/agent-logs?file=${encodeURIComponent(file)}`)
          const lj = await lr.json()
          if (Array.isArray(lj.logs)) setRunLogs(lj.logs)
          setRunRunning(Boolean(lj.running))
        } catch (e) { console.error('Log fetch failed:', e) }
      }, 1500)
    } catch (e) {
      setEditStatus('Run error: ' + String(e))
      setRunRunning(false)
    }
  }

  async function stopRun() {
    try {
      if (!runFile) return
      await fetch('http://localhost:5002/api/stop-agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file: runFile }) })
    } finally {
      if (logPollRef.current) { clearInterval(logPollRef.current); logPollRef.current = null }
      setRunRunning(false)
    }
  }

  // Fetch imported agents for current wallet
  async function fetchImportedAgents() {
    try {
      if (!address) return
      const res = await fetch(`http://localhost:5002/api/imported-agents?wallet=${address}`)
      if (res.ok) {
        const data = await res.json()
        setImportedAgents(data.agents || [])
        // Scores will be fetched automatically by useEffect when importedAgents changes
      }
    } catch (e) {
      console.error('Failed to fetch imported agents:', e)
    }
  }


  // Import agent with code fetch and run
  async function importAgent(agent) {
    try {
      setEditStatus(null)
      setEditCodeText('')
      setEditingAgent(agent)
      setShowSplitView(true)
      
      const token = (() => { try { return localStorage.getItem('agentverse_token') } catch { return null } })()
      if (!token) { setEditStatus('No Agentverse token saved — click the key icon to save it.'); return }
      
      const addr = agent.address || agent.id || agent.agent_id || agent.name
      if (!addr) { setEditStatus('Could not determine agent address/id to fetch code'); return }
      
      // Check if agent is already imported
      const agentId = String(agent.name || agent.id || agent.address || 'agent').toLowerCase().replace(/\s+/g, '-')
      const alreadyImported = importedAgents.some(a => a.agent_id === agentId || a.address === addr)
      if (alreadyImported) {
        setEditStatus('⚠️ This agent is already imported!')
        alert('This agent has already been imported to your dashboard.')
        return
      }
      
      // Show loader
      setIsImporting(true)
      setImportMessage('Fetching code from Agentverse...')
      setEditStatus('Fetching code from Agentverse...')
      
      // Fetch code from Agentverse
      const res = await fetch(`https://agentverse.ai/v1/hosting/agents/${encodeURIComponent(addr)}/code`, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      const j = await res.json()
      if (!res.ok) { setEditStatus('Failed to fetch code: ' + (j?.error || j?.message || JSON.stringify(j))); return }
      
      const extracted = jsonToPython(j) || ''
      const formatted = formatPythonCode(extracted)
      setEditCodeText(formatted)
      
      // Auto-save to project
      const defaultDomain = (agent.domain || selectedDomain || '').trim()
      const domain = window.prompt('Enter domain for this agent', defaultDomain || 'financial')
      if (domain === null) return
      
      const speciality = window.prompt("What's this agent's speciality? (e.g., portfolio advice)", '') || ''
      const name = agent.name || agent.id || agent.address || 'agent'
      const agentAddress = agent.address || agent.id || ''
      const agent_id = String(name).toLowerCase().replace(/\s+/g, '-')
      const file = `${agent_id}.py`
      
      // Include wallet address for tracking
      const payload = { 
        domain, 
        speciality, 
        agent: { agent_id, name, address: agentAddress, status: 'active', wallet: address }, 
        file, 
        code: formatted 
      }
      
      setImportMessage('Importing agent to project...')
      setEditStatus('Importing agent...')
      
      // Save to project
      const saveRes = await fetch('http://localhost:5002/api/save-agent-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const saveJ = await saveRes.json().catch(() => ({}))
      if (!saveRes.ok) { 
        setIsImporting(false)
        setEditStatus('Import failed: ' + (saveJ?.error || saveRes.status))
        return 
      }
      
      // Per-agent blockchain connection is handled via the Connect button on each agent card
      
      setImportMessage('Starting agent...')
      setEditStatus(`Agent imported: agents/${file} • domain: ${domain}`)
      
      // Add the new agent to state immediately (no reload needed)
      const newAgent = {
        agent_id,
        name,
        address: agentAddress,
        status: 'active',
        speciality,
        domain,
        file: `agents/${file}`,
        wallet: address,
        imported_at: new Date().toISOString(),
        connected: false
      }
      setImportedAgents(prev => [...prev, newAgent])
      
      // auto-run after import
      const relFile = `agents/${file}`
      setRunFile(relFile)
      await startRun(relFile)
      
      // Hide loader
      setIsImporting(false)
      setImportMessage('')
      
    } catch (err) { 
      setIsImporting(false)
      setImportMessage('')
      setEditStatus('Import failed: ' + String(err)) 
    }
  }

  // Per-agent connect action: writes to contract and updates backend JSON
  async function connectAgent(a) {
    try {
      setConnectingMap(m => ({ ...m, [a.agent_id]: true }))
      setIsImporting(true)
      setImportMessage(`Connecting ${a.name} to network...`)
      
      // Call contract to register agent
      await writeContract({
        address: AGENT_REGISTRY_ADDRESS,
        abi: AGENT_REGISTRY_ABI,
        functionName: 'registerAgent',
        args: [a.agent_id, a.name || a.agent_id, a.address || '', a.speciality || '', a.domain || '']
      })

      setImportMessage('Updating registry...')
      
      // Update JSON connected=true
      await fetch('http://localhost:5002/api/update-agent-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: a.agent_id, connected: true, wallet: address })
      })

      // Update local state immediately (no reload needed)
      setImportedAgents(prev => prev.map(ag => ag.agent_id === a.agent_id ? { ...ag, connected: true } : ag))
      
      // Trigger Teela to reload agents registry
      try {
        await fetch('http://localhost:8010/reload')
        console.log('Teela agents registry reloaded')
      } catch (reloadErr) {
        console.error('Failed to reload Teela agents:', reloadErr)
      }
      
      setEditStatus(`Agent ${a.agent_id} connected to network`)
      setIsImporting(false)
      setImportMessage('')
    } catch (err) {
      console.error('Connect agent failed:', err)
      setEditStatus('Failed to connect agent to network')
      setIsImporting(false)
      setImportMessage('')
    } finally {
      setConnectingMap(m => ({ ...m, [a.agent_id]: false }))
    }
  }

  useEffect(() => {
    if (isConnected && address) {
      fetchImportedAgents()
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



  return (
    <>
      {/* Show loader overlay when importing/connecting */}
      {isImporting && <BanterLoader message={importMessage} />}
      
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '0 0 12px' }}>
          <div className="sidebar-image">
            <TiltedCard
              imageSrc="/images/Agent-A.I.-Memecoin-Leads-5-Cryptos-Poised-for-a-5899-Explosion-in-2025.jpg"
              altText="Owner Dashboard"
              captionText="Owner Dashboard"
              containerHeight="180px"
              containerWidth="100%"
              imageHeight="180px"
              imageWidth="100%"
              rotateAmplitude={12}
              scaleOnHover={1.08}
              showMobileWarning={false}
            />
          </div>
        </div>

        {/* Dashboard Info Section - Full Width */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%)',
          border: '1px solid rgba(0, 212, 255, 0.4)',
          borderRadius: 20,
          padding: '40px 32px',
          marginBottom: 40,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0, 212, 255, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Animated background gradient */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(0, 212, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(167, 139, 250, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none'
          }}></div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ 
              margin: '0 0 16px', 
              fontSize: 32, 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #00d4ff 0%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px'
            }}>
              Agent Owner Dashboard
            </h2>
            <p style={{ 
              margin: '0 0 28px', 
              fontSize: 16, 
              lineHeight: 1.7,
              color: 'rgba(255,255,255,0.85)',
              maxWidth: '800px'
            }}>
              Manage your AI agents, track performance metrics, and monitor revenue in real-time. 
              Connect your agents from Agentverse, edit their code, and watch them earn as users rent them for various tasks.
            </p>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 20
            }}>
              <div style={{ 
                background: 'rgba(0, 212, 255, 0.15)',
                padding: '20px 24px',
                borderRadius: 12,
                border: '1px solid rgba(0, 212, 255, 0.3)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 212, 255, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#00d4ff', marginBottom: 6 }}>
                  Performance Tracking
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                  Real-time scores via Envio blockchain indexer
                </div>
              </div>
              <div style={{ 
                background: 'rgba(167, 139, 250, 0.15)',
                padding: '20px 24px',
                borderRadius: 12,
                border: '1px solid rgba(167, 139, 250, 0.3)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(167, 139, 250, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>💰</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#a78bfa', marginBottom: 6 }}>
                  Revenue Analytics
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                  Track earnings from agent rentals on-chain
                </div>
              </div>
              <div style={{ 
                background: 'rgba(81, 207, 102, 0.15)',
                padding: '20px 24px',
                borderRadius: 12,
                border: '1px solid rgba(81, 207, 102, 0.3)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(81, 207, 102, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✏️</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#51cf66', marginBottom: 6 }}>
                  Code Management
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                  Edit and update agent logic on-the-fly
                </div>
              </div>
            </div>
          </div>
        </div>

            {/* Imported Agents Section with Performance Scores */}
            {importedAgents.length > 0 && (
              <>
                <div className="section-title" style={{ fontSize: 20, marginBottom: 16 }}>Imported Agents</div>
                <div className="agent-cards">
                  {importedAgents.map((a, idx) => {
                    const score = agentScores[a.agent_id] || null
                    const formatEth = (wei) => wei ? (Number(wei) / 1e18).toFixed(6) : '0'
                    
                    return (
                    <div 
                      key={a.agent_id || idx} 
                      ref={el => cardRefs.current[idx] = el}
                      className="glass colorful agent-card" 
                      style={{ 
                        minHeight: 320, 
                        cursor: 'pointer', 
                        transition: 'all 0.3s ease',
                        transformStyle: 'preserve-3d',
                        perspective: '1000px'
                      }}
                      onMouseMove={(e) => {
                        const card = e.currentTarget
                        const rect = card.getBoundingClientRect()
                        const x = e.clientX - rect.left
                        const y = e.clientY - rect.top
                        const centerX = rect.width / 2
                        const centerY = rect.height / 2
                        const rotateX = (y - centerY) / 20
                        const rotateY = (centerX - x) / 20
                        
                        gsap.to(card, {
                          rotateX: rotateX,
                          rotateY: rotateY,
                          y: -12,
                          scale: 1.03,
                          boxShadow: '0 25px 50px rgba(0, 212, 255, 0.4)',
                          duration: 0.3,
                          ease: 'power2.out'
                        })
                      }}
                      onMouseLeave={(e) => {
                        gsap.to(e.currentTarget, {
                          rotateX: 0,
                          rotateY: 0,
                          y: 0,
                          scale: 1,
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          duration: 0.5,
                          ease: 'power2.out'
                        })
                      }}
                    >
                      {/* Header */}
                      <div style={{ marginBottom: 16 }}>
                        <h3 style={{ margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{a.name}</span>
                          <div style={{ 
                            width: 8, height: 8, borderRadius: '50%',
                            backgroundColor: a.connected ? '#00ff00' : '#666',
                            boxShadow: a.connected ? '0 0 8px #00ff00' : 'none'
                          }}></div>
                        </h3>
                        <small className="muted">{a.domain} • {a.speciality || 'No speciality'}</small>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4, wordBreak: 'break-all' }}>
                          ID: {a.agent_id}
                        </div>
                      </div>

                      {/* Performance Scores */}
                      {loadingScores ? (
                        <div style={{ 
                          padding: 20, 
                          textAlign: 'center', 
                          color: 'rgba(255,255,255,0.6)',
                          background: 'rgba(0,0,0,0.2)',
                          borderRadius: 8,
                          marginBottom: 12
                        }}>
                          Loading scores...
                        </div>
                      ) : score ? (
                        <div style={{ 
                          background: 'rgba(0, 212, 255, 0.1)',
                          border: '1px solid rgba(0, 212, 255, 0.3)',
                          borderRadius: 12,
                          padding: 16,
                          marginBottom: 12
                        }}>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 16
                          }}>
                            {/* Average Score */}
                            <div>
                              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                                Avg Score
                              </div>
                              <div style={{ fontSize: 28, fontWeight: 700, color: '#00d4ff' }}>
                                {score.averageScore?.toString() || '0'}
                              </div>
                            </div>

                            {/* Total Score */}
                            <div>
                              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                                Total Score
                              </div>
                              <div style={{ fontSize: 28, fontWeight: 700, color: '#a78bfa' }}>
                                {score.totalScore?.toString() || '0'}
                              </div>
                            </div>

                            {/* Sessions */}
                            <div>
                              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                                Sessions
                              </div>
                              <div style={{ fontSize: 20, fontWeight: 600, color: '#51cf66' }}>
                                {score.sessionCount?.toString() || '0'}
                              </div>
                            </div>

                            {/* Revenue */}
                            <div>
                              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                                Revenue
                              </div>
                              <div style={{ fontSize: 16, fontWeight: 600, color: '#ffd700' }}>
                                {formatEth(score.totalRevenue)} ETH
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ 
                          padding: 16, 
                          textAlign: 'center', 
                          color: 'rgba(255,255,255,0.5)',
                          background: 'rgba(0,0,0,0.2)',
                          borderRadius: 8,
                          marginBottom: 12,
                          fontSize: 14
                        }}>
                          No performance data yet
                        </div>
                      )}

                      {/* Agent Info - Professional Layout */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: 8,
                        marginTop: 12
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            padding: '6px 12px',
                            background: a.status === 'active' ? 'rgba(81, 207, 102, 0.2)' : 'rgba(255, 193, 7, 0.2)',
                            border: `1px solid ${a.status === 'active' ? 'rgba(81, 207, 102, 0.4)' : 'rgba(255, 193, 7, 0.4)'}`,
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            color: a.status === 'active' ? '#51cf66' : '#ffc107',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {a.status}
                          </div>
                          <button 
                            className={`btn ${a.connected ? 'success' : 'primary'}`} 
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!a.connected) connectAgent(a)
                            }}
                            disabled={a.connected || !!connectingMap[a.agent_id]}
                            style={{ 
                              fontSize: 12, 
                              padding: '8px 16px',
                              fontWeight: 600,
                              borderRadius: 6,
                              background: a.connected ? 'rgba(81, 207, 102, 0.2)' : 'rgba(0, 212, 255, 0.2)',
                              border: `1px solid ${a.connected ? 'rgba(81, 207, 102, 0.4)' : 'rgba(0, 212, 255, 0.4)'}`,
                              color: a.connected ? '#51cf66' : '#00d4ff',
                              cursor: a.connected ? 'default' : 'pointer',
                              opacity: a.connected ? 0.7 : 1
                            }}
                          >
                            {a.connected ? '✓ Connected' : (connectingMap[a.agent_id] ? 'Connecting...' : 'Connect to Teela')}
                          </button>
                        </div>
                        <div className="agent-stat">
                          <div className="agent-stat-value">{a.address ? a.address.slice(0, 10) + '...' : '-'}</div>
                          <div className="agent-stat-label">Address</div>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
                <div style={{ marginBottom: 32 }}></div>
              </>
            )}

            {/* Metrics Grid - Using imported agents */}
            <div className="metrics-grid">
              <div className="glass colorful metric-card">
                <div className="metric-value">{importedAgents.filter(a => a.connected).length}</div>
                <div className="metric-label">Connected Agents</div>
              </div>
              
              <div className="glass colorful metric-card">
                <div className="metric-value">{importedAgents.length}</div>
                <div className="metric-label">Total Agents</div>
              </div>
              
              <div className="glass colorful metric-card">
                <div className="metric-value">{agentverseAgents.length}</div>
                <div className="metric-label">Agentverse Agents</div>
              </div>
            </div>

            {/* Agentverse Agents */}
            {agentverseLoading && <p className="muted" style={{ textAlign: 'center' }}>Loading Agentverse agents...</p>}
            
            {agentverseAgents.length > 0 && (
              <>
                <div className="section-title" style={{ fontSize: 20, marginBottom: 16, marginTop: 32 }}>Agentverse Agents</div>
                <div className="agent-cards">
                  {agentverseAgents.map((a, idx) => (
                    <div key={a.id || a.address || idx} className="glass colorful agent-card">
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
                        {(() => {
                          const agentId = String(a.name || a.id || a.address || 'agent').toLowerCase().replace(/\s+/g, '-')
                          const addr = a.address || a.id || a.agent_id || a.name
                          const isImported = importedAgents.some(ia => ia.agent_id === agentId || ia.address === addr)
                          return isImported ? (
                            <button className="btn success" disabled style={{ cursor: 'not-allowed' }}>✓ Imported</button>
                          ) : (
                            <button className="btn" onClick={(e) => { e.stopPropagation(); importAgent(a) }}>Import</button>
                          )
                        })()}
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
                        <div className="glass colorful card" style={{ marginTop: 12 }}>
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
            
            {!agentverseLoading && agentverseAgents.length === 0 && importedAgents.length === 0 && (
              <div className="glass colorful card">
                <p style={{ margin: 0, textAlign: 'center' }}>No agents found. Upload your first agent to get started!</p>
              </div>
            )}

            {/* Full-screen Modal Editor for Agentverse agent code */}
            {editingAgent && (
              <div className="modal-overlay" onClick={() => { setEditingAgent(null); setEditCodeText(''); setEditStatus(null); setShowSplitView(false); if (logPollRef.current) { clearInterval(logPollRef.current); logPollRef.current = null } }}>
                <div className="glass colorful modal-content" onClick={(e) => e.stopPropagation()}>
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
                      <button className="btn" onClick={(e) => { e.stopPropagation(); setEditingAgent(null); setEditCodeText(''); setEditStatus(null); setShowSplitView(false) }}>Close</button>
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
                      <button className="btn" onClick={(e) => { e.stopPropagation(); saveToProject() }}>Save & Run</button>
                      {runFile && (
                        <>
                          <button className="btn" onClick={(e) => { e.stopPropagation(); startRun(runFile) }} disabled={runRunning}>Run</button>
                          <button className="btn" onClick={(e) => { e.stopPropagation(); stopRun() }} disabled={!runRunning}>Stop</button>
                        </>
                      )}
                    </div>
                  </div>
                  {runFile && (
                    <div className="glass colorful card" style={{ marginTop: 12 }}>
                      <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Live Logs {runRunning ? '(running...)' : '(stopped)'} — {runFile}</span>
                        <div className="actions">
                          <button className="btn" onClick={(e) => { e.stopPropagation(); setRunLogs([]) }}>Clear</button>
                        </div>
                      </div>
                      <pre style={{ maxHeight: 280, overflow: 'auto', background: 'rgba(0,0,0,0.35)', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap' }}>{(runLogs || []).join('')}</pre>
                    </div>
                  )}
                </div>
              </div>
            )}
      </div>
    </>
  )
}
