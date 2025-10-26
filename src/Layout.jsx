import { useState, useEffect } from 'react'
import Particles from './Particles'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react'
import { SessionTimer } from './components/SessionTimer'

export default function Layout({ children, currentView, onNavigate, onBack, canGoBack, session, onSessionExpire }) {
  const [showApiPanel, setShowApiPanel] = useState(false)
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem('agentverse_token') || '' } catch { return '' }
  })
  const [connected, setConnected] = useState(() => {
    try { return !!localStorage.getItem('agentverse_token') } catch { return false }
  })

  useEffect(() => {
    const onTokenChange = () => {
      try { setConnected(!!localStorage.getItem('agentverse_token')) } catch { setConnected(false) }
    }
    window.addEventListener('agentverse_token_changed', onTokenChange)
    return () => window.removeEventListener('agentverse_token_changed', onTokenChange)
  }, [])
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'agents', label: 'Agents' },
    { id: 'teela', label: 'Teela' },
    { id: 'upload', label: 'Upload Agent' },
    { id: 'owner', label: 'Owner Dashboard' },
  ]

  return (
    <div className="app-layout">
      {/* Universal particle background */}
      <Particles
        className="particles-container"
        particleColors={['#ffffff', '#ffffff']}
        particleCount={300}
        particleSpread={12}
        speed={0.08}
        particleBaseSize={90}
        moveParticlesOnHover={true}
        alphaParticles={true}
        disableRotation={false}
        sizeRandomness={0.6}
        particleHoverFactor={1.2}
      />

      {/* Navigation bar */}
      <nav className="nav-bar">
        <div className="nav-inner">
          <div className="brand">
            <div className="brand-name">TEELA</div>
          </div>
          
          {canGoBack && (
            <button 
              className="btn back-btn" 
              onClick={onBack}
              style={{ 
                marginRight: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px'
              }}
            >
              <span style={{ fontSize: 16 }}>←</span> Back
            </button>
          )}
          
          <div className="nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={currentView === item.id ? 'active' : ''}
                onClick={() => onNavigate(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="controls-row">
            {/* Session Timer */}
            {session && session.startTime && (
              <SessionTimer session={session} onExpire={onSessionExpire} />
            )}
            
            <ConnectButton />
            <SignedOut>
              <SignInButton />
              <SignUpButton />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
            
            {/* API Key Icon */}
            <div className={`api-key-icon ${connected ? 'connected' : ''}`} onClick={() => setShowApiPanel(!showApiPanel)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
              
              {showApiPanel && (
                <div className="api-key-panel" onClick={(e) => e.stopPropagation()}>
                  <div style={{ marginBottom: 12 }}>
                    <strong>Agentverse API Key</strong>
                    <p className="muted" style={{ fontSize: 12, margin: '4px 0 0' }}>
                      Enter your token to access deployed agents
                    </p>
                  </div>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter API key..."
                    style={{ width: '100%', marginBottom: 12 }}
                  />
                  <div className="actions">
                    <button 
                      className="btn primary"
                      onClick={() => {
                        try {
                          localStorage.setItem('agentverse_token', apiKey)
                          setShowApiPanel(false)
                          window.dispatchEvent(new Event('agentverse_token_changed'))
                          setConnected(true)
                        } catch (e) {
                          console.error('Failed to save API key:', e)
                        }
                      }}
                    >
                      Save
                    </button>
                    <button 
                      className="btn"
                      onClick={() => {
                        setApiKey('')
                        try {
                          localStorage.removeItem('agentverse_token')
                          window.dispatchEvent(new Event('agentverse_token_changed'))
                          setConnected(false)
                        } catch (e) {
                          console.error('Failed to clear API key:', e)
                        }
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="container">
        {children}
      </main>
    </div>
  )
}
