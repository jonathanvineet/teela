import { useState, useEffect } from 'react'
import './App.css'
import AgentChat from './AgentChat'
import TeelaChat from './TeelaChat'
import TeelaDomains from './TeelaDomains'
import BlurText from './BlurText'
import ClickSpark from './ClickSpark'
import { ParticleCard } from './MagicBento'
import AgentsList from './AgentsList'
// import AgentRegister from './AgentRegister'
import AgentUpload from './AgentUpload'
import OwnerDashboard from './OwnerDashboard'
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/clerk-react'
// Removed legacy AgentverseFetch panel — API key panel in Layout now drives fetching
import Layout from './Layout'

function App() {
  const [openChat, setOpenChat] = useState(false)
  const [view, setView] = useState(() => {
    // Restore view from sessionStorage on reload
    try {
      return sessionStorage.getItem('teela_view') || 'home'
    } catch {
      return 'home'
    }
  })
  const [activeAgent, setActiveAgent] = useState(null)
  const [selectedDomain, setSelectedDomain] = useState(() => {
    // Restore selected domain from sessionStorage
    try {
      const saved = sessionStorage.getItem('teela_domain')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [navigationHistory, setNavigationHistory] = useState(() => {
    // Restore navigation history
    try {
      const saved = sessionStorage.getItem('teela_history')
      return saved ? JSON.parse(saved) : ['home']
    } catch {
      return ['home']
    }
  })
  const quotes = [
    'From prompts to protocols: agents become infrastructure.',
    'Agents are the new APIs — composable, autonomous, unstoppable.',
    'Ship agents like microservices. Orchestrate them like teams.',
    'Own your agent. Own your workflow. Own your data.',
    'Intents in. Outcomes out. The rest is automation.',
    'Protocols outlive products. Agents turn products into protocols.',
    'The interface is not the app — the agent is.',
  ]
  const [quoteIndex, setQuoteIndex] = useState(0)

  // Rotate hero quotes every 30 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setQuoteIndex((i) => (i + 1) % quotes.length)
    }, 30000)
    return () => clearInterval(id)
  }, [quotes.length])

  const handleNavigate = (newView) => {
    if (newView !== view) {
      const newHistory = [...navigationHistory, newView]
      setNavigationHistory(newHistory)
      setView(newView)
      // Save to sessionStorage
      try {
        sessionStorage.setItem('teela_view', newView)
        sessionStorage.setItem('teela_history', JSON.stringify(newHistory))
      } catch {
        // Ignore sessionStorage errors
      }
    } else {
      // If navigating to the same view, don't modify history
      console.log('Already on view:', newView)
    }
  }

  const handleBack = () => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory]
      newHistory.pop() // Remove current
      const previousView = newHistory[newHistory.length - 1]
      setNavigationHistory(newHistory)
      setView(previousView)
      // Save to sessionStorage
      try {
        sessionStorage.setItem('teela_view', previousView)
        sessionStorage.setItem('teela_history', JSON.stringify(newHistory))
      } catch {
        // Ignore sessionStorage errors
      }
      // Clear domain selection when going back from teela chat
      if (previousView === 'teela' && selectedDomain) {
        setSelectedDomain(null)
        try {
          sessionStorage.removeItem('teela_domain')
        } catch {
          // Ignore sessionStorage errors
        }
      }
    }
  }


  return (
    <ClickSpark sparkColor="#fff" sparkSize={10} sparkRadius={18} sparkCount={10} duration={450}>
      <Layout currentView={view} onNavigate={handleNavigate} onBack={handleBack} canGoBack={navigationHistory.length > 1}>
        <div style={{ display: 'grid', gap: 20 }}>
        {/* HOME */}
        {view === 'home' && (
          <>
            <h1 className="hero-title">TEELA</h1>
            <BlurText
              text={quotes[quoteIndex]}
              delay={150}
              animateBy="words"
              direction="top"
              className="hero-quote"
            />

            <div className="square-grid" style={{ 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: 28, 
              maxWidth: '1200px', 
              margin: '0 auto',
              '@media (min-width: 900px)': { gridTemplateColumns: 'repeat(3, 1fr)' }
            }}>
                  <ParticleCard 
                    className="glass colorful square" 
                    style={{ padding: 28, minHeight: 380 }}
                    enableTilt={true}
                    enableMagnetism={true}
                    clickEffect={true}
                    particleCount={8}
                    glowColor="132, 0, 255"
                  >
                    <div>
                      <img className="card-thumb" src="/images/Agent-A.I.-Memecoin-Leads-5-Cryptos-Poised-for-a-5899-Explosion-in-2025.jpg" alt="Agents" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12 }} />
                      <h3>Agents</h3>
                      <p>Browse and chat with listed agents by domain.</p>
                    </div>
                    <button className="btn primary" onClick={() => handleNavigate('agents')}>Open</button>
                  </ParticleCard>
                  <ParticleCard 
                    className="glass colorful square" 
                    style={{ padding: 28, minHeight: 380 }}
                    enableTilt={true}
                    enableMagnetism={true}
                    clickEffect={true}
                    particleCount={8}
                    glowColor="132, 0, 255"
                  >
                    <div>
                      <img className="card-thumb" src="/images/docs.webp" alt="Upload Agent" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12 }} />
                      <h3>Upload Agent</h3>
                      <p>Create/host your agent with minimal fields.</p>
                    </div>
                    <button className="btn primary" onClick={() => handleNavigate('upload')}>Open</button>
                  </ParticleCard>
                  {/* Register card removed per request */}
                  <ParticleCard 
                    className="glass colorful square" 
                    style={{ padding: 28, minHeight: 380 }}
                    enableTilt={true}
                    enableMagnetism={true}
                    clickEffect={true}
                    particleCount={8}
                    glowColor="132, 0, 255"
                  >
                    <div>
                      <img className="card-thumb" src="/images/owner.avif" alt="Owner Dashboard" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12 }} />
                      <h3>Owner Dashboard</h3>
                      <p>Stats, scoring, and Agentverse integration.</p>
                    </div>
                    <button className="btn primary" onClick={() => handleNavigate('owner')}>Open</button>
                  </ParticleCard>
                  <ParticleCard 
                    className="glass colorful square" 
                    style={{ padding: 28, minHeight: 380 }}
                    enableTilt={true}
                    enableMagnetism={true}
                    clickEffect={true}
                    particleCount={8}
                    glowColor="132, 0, 255"
                  >
                    <div>
                      <img className="card-thumb" src="/images/examples.jpeg" alt="Explore Examples" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12 }} />
                      <h3>Explore Examples</h3>
                      <p>Discover pre-built agent templates and use cases.</p>
                    </div>
                    <button className="btn primary">Explore</button>
                  </ParticleCard>
                  {/* New Teela card (bottom middle) */}
                  <ParticleCard 
                    className="glass colorful square" 
                    style={{ padding: 28, minHeight: 380 }}
                    enableTilt={true}
                    enableMagnetism={true}
                    clickEffect={true}
                    particleCount={8}
                    glowColor="132, 0, 255"
                  >
                    <div>
                      <img className="card-thumb" src="/images/teela.jpeg" alt="Teela" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12 }} />
                      <h3>Teela</h3>
                      <p>Ask our orchestrator agent.</p>
                    </div>
                    <button className="btn primary" onClick={() => handleNavigate('teela')}>Ask</button>
                  </ParticleCard>
                  <ParticleCard 
                    className="glass colorful square" 
                    style={{ padding: 28, minHeight: 380 }}
                    enableTilt={true}
                    enableMagnetism={true}
                    clickEffect={true}
                    particleCount={8}
                    glowColor="132, 0, 255"
                  >
                    <div>
                      <img className="card-thumb" src="/images/docs.jpg" alt="Documentation" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12 }} />
                      <h3>Documentation</h3>
                      <p>Learn how to build and deploy agents on TEELA.</p>
                    </div>
                    <button className="btn primary">Read</button>
                  </ParticleCard>
            </div>
          </>
        )}

        {/* Conditional views (unchanged logic) */}
        {openChat && (
          <ParticleCard className="glass card" style={{ padding: 0 }} enableTilt={true} enableMagnetism={true} clickEffect={true} particleCount={6} glowColor="132, 0, 255">
            <AgentChat agentName={(activeAgent && activeAgent.name) || 'Alice'} onClose={() => setOpenChat(false)} />
          </ParticleCard>
        )}

        {view === 'teela' && !selectedDomain && (
          <TeelaDomains onSelectDomain={(domain) => {
            setSelectedDomain(domain)
            try {
              sessionStorage.setItem('teela_domain', JSON.stringify(domain))
            } catch {
              // Ignore sessionStorage errors
            }
          }} />
        )}

        {view === 'teela' && selectedDomain && (
          <TeelaChat 
            domain={selectedDomain} 
            onClose={() => {
              setSelectedDomain(null)
              try {
                sessionStorage.removeItem('teela_domain')
              } catch {
                // Ignore sessionStorage errors
              }
              handleNavigate('home')
            }} 
            onBack={() => {
              setSelectedDomain(null)
              try {
                sessionStorage.removeItem('teela_domain')
              } catch {
                // Ignore sessionStorage errors
              }
            }}
          />
        )}

        {view === 'agents' && (
          <AgentsList onOpenChat={(agent) => { setActiveAgent(agent); setOpenChat(true); }} />
        )}

        {/* Register view removed per request */}
        {view === 'upload' && (
          <AgentUpload />
        )}
        {view === 'owner' && (
          <OwnerDashboard />
        )}
        </div>
      </Layout>
    </ClickSpark>
  )
}

export default App
