import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

export default function RentalSession({ rental, domain, onSessionEnd }) {
  const { address } = useAccount()
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isEnding, setIsEnding] = useState(false)
  
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // You'll need to set these after deploying the contract
  const ESCROW_ADDRESS = '0x...' // SET THIS AFTER DEPLOYMENT
  const ESCROW_ABI = [] // SET THIS AFTER DEPLOYMENT

  useEffect(() => {
    if (!rental) return

    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = Math.floor((now - rental.startTime) / 1000) // seconds
      const remaining = Math.max(0, Math.floor((rental.endTime - now) / 1000))
      
      setTimeElapsed(elapsed)
      setTimeRemaining(remaining)

      if (remaining === 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [rental])

  useEffect(() => {
    if (isSuccess) {
      onSessionEnd()
    }
  }, [isSuccess])

  async function handleEndSession() {
    if (!rental || !address) return
    
    setIsEnding(true)
    try {
      const hoursUsed = Math.ceil(timeElapsed / 3600) // Round up to nearest hour
      
      await writeContract({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        functionName: 'completeRental',
        args: [rental.rentalId, BigInt(hoursUsed)]
      })
    } catch (err) {
      console.error('End session failed:', err)
      setIsEnding(false)
    }
  }

  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  function getRefundEstimate() {
    if (!rental || !domain) return '0'
    const hoursUsed = Math.ceil(timeElapsed / 3600)
    const hoursPaid = rental.hours
    const refundHours = Math.max(0, hoursPaid - hoursUsed)
    const refundAmount = (refundHours * parseFloat(domain.hourlyRate)).toFixed(4)
    return refundAmount
  }

  if (!rental || !domain) return null

  const percentageUsed = Math.min(100, (timeElapsed / (rental.hours * 3600)) * 100)
  const isExpired = timeRemaining === 0

  return (
    <div className="glass colorful card" style={{ padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
            🔄 Active Rental Session
          </div>
          <div className="muted" style={{ fontSize: 14 }}>
            Domain: {domain.title}
          </div>
        </div>
        <div style={{ 
          padding: '6px 12px', 
          background: isExpired ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 255, 0, 0.2)',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600
        }}>
          {isExpired ? '⏰ EXPIRED' : '✅ ACTIVE'}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ 
          height: 8, 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: 4,
          overflow: 'hidden'
        }}>
          <div style={{ 
            height: '100%', 
            width: `${percentageUsed}%`,
            background: isExpired ? 'linear-gradient(90deg, #ff0000, #ff6b6b)' : 'linear-gradient(90deg, #8400ff, #00d4ff)',
            transition: 'width 1s linear'
          }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12 }}>
          <span className="muted">Time Used: {formatTime(timeElapsed)}</span>
          <span className="muted">Time Left: {formatTime(timeRemaining)}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: 12,
        marginBottom: 20
      }}>
        <div style={{ padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{rental.hours}h</div>
          <div className="muted" style={{ fontSize: 11 }}>Paid For</div>
        </div>
        <div style={{ padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{Math.ceil(timeElapsed / 3600)}h</div>
          <div className="muted" style={{ fontSize: 11 }}>Used</div>
        </div>
        <div style={{ padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{getRefundEstimate()} ETH</div>
          <div className="muted" style={{ fontSize: 11 }}>Est. Refund</div>
        </div>
      </div>

      {isExpired && (
        <div style={{ 
          padding: 12, 
          background: 'rgba(255, 165, 0, 0.2)', 
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 13
        }}>
          ⚠️ Your rental time has expired. The payment will be automatically released to the agent owner.
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button 
          className="btn primary" 
          onClick={handleEndSession}
          disabled={isPending || isConfirming || isEnding}
          style={{ flex: 1 }}
        >
          {isPending || isConfirming ? '⏳ Ending Session...' : '🛑 End Session & Get Refund'}
        </button>
      </div>

      {(isPending || isConfirming) && (
        <div className="muted" style={{ marginTop: 12, textAlign: 'center', fontSize: 12 }}>
          {isPending && '📝 Waiting for wallet confirmation...'}
          {isConfirming && '⏳ Processing refund...'}
        </div>
      )}
    </div>
  )
}
