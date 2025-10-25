import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'

export default function RentalPayment({ domain, onPaymentSuccess, onCancel }) {
  const { address } = useAccount()
  const [hours, setHours] = useState(1)
  const [totalCost, setTotalCost] = useState('0')
  const [isPaying, setIsPaying] = useState(false)
  
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // You'll need to set these after deploying the contract
  const ESCROW_ADDRESS = '0x...' // SET THIS AFTER DEPLOYMENT
  const ESCROW_ABI = [] // SET THIS AFTER DEPLOYMENT

  useEffect(() => {
    if (domain && domain.hourlyRate) {
      const cost = (parseFloat(domain.hourlyRate) * hours).toFixed(4)
      setTotalCost(cost)
    }
  }, [hours, domain])

  useEffect(() => {
    if (isSuccess && !isPaying) {
      onPaymentSuccess({
        rentalId: hash, // You'll get actual rentalId from contract events
        hours,
        startTime: Date.now(),
        endTime: Date.now() + (hours * 3600000)
      })
    }
  }, [isSuccess])

  async function handlePayment() {
    if (!domain || !address) return
    
    setIsPaying(true)
    try {
      await writeContract({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        functionName: 'startRental',
        args: [domain.id, BigInt(hours)],
        value: parseEther(totalCost)
      })
    } catch (err) {
      console.error('Payment failed:', err)
      setIsPaying(false)
    }
  }

  if (!domain) return null

  return (
    <div className="glass colorful card" style={{ padding: 24, maxWidth: 500, margin: '0 auto' }}>
      <div className="section-title" style={{ marginBottom: 20 }}>
        💳 Rent Domain: {domain.title}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="muted" style={{ marginBottom: 8 }}>Domain Details:</div>
        <div style={{ padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>Category:</strong> {domain.title}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Hourly Rate:</strong> {domain.hourlyRate} ETH/hour
          </div>
          <div>
            <strong>Description:</strong> {domain.description}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          <strong>Select Hours:</strong>
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button 
            className="btn" 
            onClick={() => setHours(Math.max(1, hours - 1))}
            disabled={hours <= 1}
          >
            -
          </button>
          <input 
            type="number" 
            min="1" 
            max="24" 
            value={hours} 
            onChange={(e) => setHours(Math.max(1, parseInt(e.target.value) || 1))}
            style={{ width: 80, textAlign: 'center' }}
          />
          <button 
            className="btn" 
            onClick={() => setHours(Math.min(24, hours + 1))}
            disabled={hours >= 24}
          >
            +
          </button>
          <span className="muted">hours</span>
        </div>
      </div>

      <div style={{ 
        padding: 16, 
        background: 'rgba(132, 0, 255, 0.2)', 
        borderRadius: 8,
        border: '1px solid rgba(132, 0, 255, 0.4)',
        marginBottom: 20
      }}>
        <div style={{ fontSize: 14, marginBottom: 4, color: '#aaa' }}>Total Cost:</div>
        <div style={{ fontSize: 28, fontWeight: 700 }}>{totalCost} ETH</div>
        <div style={{ fontSize: 12, marginTop: 4, color: '#aaa' }}>
          + 5% platform fee (included)
        </div>
      </div>

      <div className="muted" style={{ fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>
        ⚠️ <strong>Important:</strong> Payment is held in escrow. You can cancel within 5 minutes for a full refund. 
        Unused time will be refunded when you end the session.
      </div>

      {error && (
        <div style={{ 
          padding: 12, 
          background: 'rgba(255, 0, 0, 0.2)', 
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 14
        }}>
          ❌ {error.message}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button 
          className="btn" 
          onClick={onCancel}
          disabled={isPending || isConfirming}
        >
          Cancel
        </button>
        <button 
          className="btn primary" 
          onClick={handlePayment}
          disabled={!address || isPending || isConfirming || isPaying}
          style={{ flex: 1 }}
        >
          {isPending || isConfirming ? '⏳ Processing...' : `💳 Pay ${totalCost} ETH`}
        </button>
      </div>

      {(isPending || isConfirming) && (
        <div className="muted" style={{ marginTop: 12, textAlign: 'center', fontSize: 12 }}>
          {isPending && '📝 Waiting for wallet confirmation...'}
          {isConfirming && '⏳ Transaction confirming...'}
        </div>
      )}
    </div>
  )
}
