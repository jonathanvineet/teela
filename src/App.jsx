import { useState, useEffect } from 'react'
import './App.css'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { getEthBalanceFromBackend } from './api'
import { ethers } from 'ethers'
import AgentChat from './AgentChat'
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
  const { address, isConnected } = useAccount()
  const [backendBalance, setBackendBalance] = useState(null)
  const [walletBalance, setWalletBalance] = useState(null)
  const [agentStatus, setAgentStatus] = useState(null)
  const [openChat, setOpenChat] = useState(false)
    const [view, setView] = useState('home') // 'home' | 'dashboard' | 'agents' | 'register' | 'upload' | 'owner'
  const [activeAgent, setActiveAgent] = useState(null)


  useEffect(() => {
    if (!isConnected || !address) return
    // call backend
    getEthBalanceFromBackend(address)
      .then((data) => setBackendBalance(data))
      .catch((err) => console.error(err))

    // ethers.js example: use window.ethereum provider
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum)
      provider.getBalance(address).then((b) => setWalletBalance(ethers.formatEther(b)))
    }
  }, [isConnected, address])

  useEffect(() => {
    fetchAgentStatus().then(setAgentStatus);
  }, []);

  async function fetchAgentStatus() {
    try {
      const res = await fetch('/api/agent-status');
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error(err)
      return null;
    }
  }

  return (
    <Layout currentView={view} onNavigate={setView}>
      <div style={{ display: 'grid', gap: 20 }}>
        {/* HOME */}
        {view === 'home' && (
          <>
            <h1 className="hero-title">TEELA</h1>
            <p className="hero-quote">From prompts to protocols: agents become infrastructure.</p>

            <div className="square-grid">
                  <div className="glass square">
                    <div>
                      <img className="card-thumb" src="/images/Agent-A.I.-Memecoin-Leads-5-Cryptos-Poised-for-a-5899-Explosion-in-2025.jpg" alt="Agents" />
                      <h3>Agents</h3>
                      <p>Browse and chat with listed agents by domain.</p>
                    </div>
                    <button className="btn primary" onClick={() => setView('agents')}>Open</button>
                  </div>
                  <div className="glass square">
                    <div>
                      <img className="card-thumb" src="/images/examples.jpeg" alt="Upload Agent" />
                      <h3>Upload Agent</h3>
                      <p>Create/host your agent with minimal fields.</p>
                    </div>
                    <button className="btn primary" onClick={() => setView('upload')}>Open</button>
                  </div>
                  {/* Register card removed per request */}
                  <div className="glass square">
                    <div>
                      <img className="card-thumb" src="/images/owner.avif" alt="Owner Dashboard" />
                      <h3>Owner Dashboard</h3>
                      <p>Stats, scoring, and Agentverse integration.</p>
                    </div>
                    <button className="btn primary" onClick={() => setView('owner')}>Open</button>
                  </div>
                  <div className="glass square">
                    <div>
                      <img className="card-thumb" src="/images/examples.jpeg" alt="Explore Examples" />
                      <h3>Explore Examples</h3>
                      <p>Discover pre-built agent templates and use cases.</p>
                    </div>
                    <button className="btn primary">Explore</button>
                  </div>
                  {/* New Teela card (bottom middle) */}
                  <div className="glass square">
                    <div>
                      <img className="card-thumb" src="/images/teela.jpeg" alt="Teela" />
                      <h3>Teela</h3>
                      <p>Ask our orchestrator agent.</p>
                    </div>
                    <button className="btn primary" onClick={() => setView('agents')}>Ask</button>
                  </div>
                  <div className="glass square">
                    <div>
                      <img className="card-thumb" src="/images/docs.webp" alt="Documentation" />
                      <h3>Documentation</h3>
                      <p>Learn how to build and deploy agents on TEELA.</p>
                    </div>
                    <button className="btn primary">Read</button>
                  </div>
            </div>
          </>
        )}
        
        {/* Wallet status panel */}
        {isConnected && (
          <div className="glass card" style={{ textAlign: 'left' }}>
            <div className="section-title">Connection</div>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div><strong>Address</strong><div className="hint">{address}</div></div>
              <div><strong>Backend balance</strong><div className="hint">{backendBalance ? backendBalance.balance?.ether : 'loading...'}</div></div>
              <div><strong>Wallet balance</strong><div className="hint">{walletBalance ?? 'loading...'}</div></div>
            </div>
          </div>
        )}

        {/* Dashboard view */}
        {view === 'dashboard' && (
          <div className="glass card" style={{ textAlign: 'left' }}>
            <div className="section-title">Agent Setup / Status</div>
            {agentStatus ? (
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div><strong>Name</strong><div className="hint">{agentStatus.name}</div></div>
                <div><strong>Address</strong><div className="hint">{agentStatus.address}</div></div>
                <div><strong>Status</strong><div className="hint">{agentStatus.online ? 'Online' : 'Offline'}</div></div>
              </div>
            ) : (
              <p className="muted">Loading agent status...</p>
            )}
            <div style={{ marginTop: 12 }}>
              <button className="btn primary" onClick={() => setOpenChat(true)}>Agent Chat</button>
            </div>
          </div>
        )}

        {/* Conditional views (unchanged logic) */}
        {openChat && (
          <div className="glass card" style={{ padding: 0 }}>
            <AgentChat agentName={(activeAgent && activeAgent.name) || agentStatus?.name || 'Alice'} onClose={() => setOpenChat(false)} />
          </div>
        )}

        {view === 'agents' && (
          <div className="glass card" style={{ padding: 0 }}>
            <AgentsList onOpenChat={(agent) => { setActiveAgent(agent); setOpenChat(true); }} />
          </div>
        )}

        {/* Register view removed per request */}
        {view === 'upload' && (
          <div className="glass card" style={{ padding: 0 }}>
            <AgentUpload />
          </div>
        )}
        {view === 'owner' && (
          <OwnerDashboard />
        )}
      </div>
    </Layout>
  )
}

export default App
