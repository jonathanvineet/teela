import { useState, useRef, useEffect } from 'react'

function LoadingSpinner() {
  return (
    <div style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: 8,
      animation: 'pulse 2s ease-in-out infinite'
    }}>
      <div style={{
        width: 16,
        height: 16,
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: 'white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}

export default function TeelaChat({ domain, onClose, onBack }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  async function pollForResponse(requestId, maxAttempts = 50) {
    // Wait 3 seconds before first poll to let TEELA start processing
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Poll every 2 seconds for up to 100 seconds total
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:8010/response?request_id=${requestId}`)
        const data = await res.json()
        
        if (data.status === 'success') {
          return data.message
        } else if (data.status === 'not_found') {
          // Only throw error after several attempts
          if (i > 3) {
            throw new Error('Request not found or expired')
          }
          // Otherwise continue polling
        }
        // If still processing, wait and try again
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (e) {
        // Network errors - retry
        if (i < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
          continue
        }
        console.error('Poll error:', e)
        throw e
      }
    }
    throw new Error('Response timeout - agents took too long to respond')
  }

  async function send() {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    setLoading(true)
    
    // Calculate index BEFORE adding messages
    const currentLength = messages.length
    const thinkingIndex = currentLength + 1
    
    // Add user message and thinking message together
    setMessages((m) => [
      ...m,
      { role: 'user', text },
      { role: 'system', text: '🤔 TEELA is orchestrating responses from specialized agents...' }
    ])
    
    try {
      // Step 1: Submit query and get request_id
      const res = await fetch('/api/teela-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })
      const j = await res.json()
      
      // Parse the reply (it's double-encoded JSON)
      let replyData
      try {
        replyData = JSON.parse(j.reply || '{}')
      } catch {
        replyData = {}
      }
      
      const requestId = replyData.request_id
      
      if (!requestId) {
        throw new Error('No request_id received from TEELA')
      }
      
      console.log('Request ID:', requestId)
      
      // Update thinking message with spinner
      setMessages((m) => {
        const newMessages = [...m]
        newMessages[thinkingIndex] = { 
          role: 'system', 
          text: `🔄 TEELA is consulting ${replyData.agent_count || 3} specialized agents...\n⏳ This may take 10-20 seconds...` 
        }
        return newMessages
      })
      
      // Step 2: Poll for the response (with initial delay built in)
      const finalResponse = await pollForResponse(requestId)
      
      // Step 3: Display the final response
      setMessages((m) => {
        const newMessages = [...m]
        // Remove thinking message and add real response
        newMessages[thinkingIndex] = { role: 'agent', text: finalResponse }
        return newMessages
      })
      
    } catch (e) {
      console.error('TeelaChat send error:', e)
      setMessages((m) => {
        const newMessages = [...m]
        newMessages[thinkingIndex] = { 
          role: 'system', 
          text: `❌ Error: ${e.message || 'Failed to reach TEELA'}` 
        }
        return newMessages
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      position: 'relative',
      width: '100%',
      height: 'calc(100vh - 140px)',
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
      marginTop: '20px'
    }}>
      {/* Header with domain info and buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '20px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {domain && domain.icon && (
            <img 
              src={domain.icon} 
              alt={domain.title}
              style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 12,
                objectFit: 'cover',
                border: '1px solid rgba(255,255,255,0.2)'
              }} 
            />
          )}
          <div>
            <div style={{ 
              fontSize: 28, 
              fontWeight: 700, 
              fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
              letterSpacing: '0.5px'
            }}>
              {domain ? domain.title : 'TEELA'}
            </div>
            {domain && <div className="muted" style={{ fontSize: 14 }}>{domain.description}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onBack && <button className="btn" onClick={onBack}>Back</button>}
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>

      {/* Chat messages area */}
      <div ref={scrollRef} style={{ 
        flex: 1, 
        overflowY: 'auto', 
        overflowX: 'hidden',
        padding: '24px',
        minHeight: 0
      }}>
        {messages.length === 0 && (
          <p className="muted" style={{ textAlign: 'center', marginTop: 40 }}>
            {domain 
              ? `Ask anything about ${domain.title.toLowerCase()}. Teela will orchestrate specialized agents to help you.`
              : 'Ask anything. Teela will orchestrate domain agents.'}
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', marginBottom: 16, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div className={`bubble ${m.role}`}>
              {m.role === 'system' && m.text.includes('🔄') ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <LoadingSpinner />
                  <div>{m.text}</div>
                </div>
              ) : (
                <div>{m.text}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input area - Fixed to bottom */}
      <div style={{ 
        display: 'flex', 
        gap: 8,
        padding: '16px 24px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        background: '#000',
        flexShrink: 0
      }}>
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder={loading ? 'Sending...' : 'Type your message and press Enter...'} 
          disabled={loading} 
          style={{ flex: 1 }} 
        />
        <button className="btn primary" onClick={send} disabled={loading || !input.trim()}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
