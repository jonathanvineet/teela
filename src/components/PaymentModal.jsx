import { useState } from 'react';
import { usePayment } from '../hooks/usePayment';
import { DOMAIN_RATES } from '../config/contracts';

export function PaymentModal({ domain, onSuccess, onClose }) {
  const { createPaymentSession, isProcessing, error } = usePayment();
  const [txHash, setTxHash] = useState(null);

  const handlePayment = async () => {
    const result = await createPaymentSession(domain.id);
    
    if (result.success) {
      setTxHash(result.txHash);
      // Wait a moment then call success
      setTimeout(() => {
        onSuccess({
          sessionId: result.sessionId,
          domain: domain.id,
          amount: result.amount,
          txHash: result.txHash,
          startTime: result.startTime
        });
      }, 1500);
    }
  };

  const rate = DOMAIN_RATES[domain.id] || '0.002';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(10px)'
    }}>
      <div className="glass" style={{
        maxWidth: 500,
        width: '90%',
        padding: 32,
        borderRadius: 16,
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: 8,
            width: 32,
            height: 32,
            cursor: 'pointer',
            fontSize: 18
          }}
        >
          ✕
        </button>

        <h2 style={{ marginTop: 0, marginBottom: 8 }}>💳 Payment Required</h2>
        <p className="muted" style={{ marginBottom: 24 }}>
          To chat with TEELA in the <strong>{domain.title}</strong> domain
        </p>

        <div style={{
          background: 'rgba(0, 212, 255, 0.1)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 24
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span>Hourly Rate:</span>
            <strong style={{ color: '#00d4ff' }}>{rate} ETH</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span>Session Duration:</span>
            <strong>1 hour</strong>
          </div>
          <div style={{ 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
            paddingTop: 12,
            marginTop: 12,
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: 18, fontWeight: 600 }}>Total:</span>
            <strong style={{ fontSize: 20, color: '#00d4ff' }}>{rate} ETH</strong>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 0, 0, 0.1)',
            border: '1px solid rgba(255, 0, 0, 0.3)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            color: '#ff6b6b'
          }}>
            ⚠️ {error}
          </div>
        )}

        {txHash && (
          <div style={{
            background: 'rgba(0, 255, 0, 0.1)',
            border: '1px solid rgba(0, 255, 0, 0.3)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            color: '#51cf66'
          }}>
            ✅ Payment successful! Starting chat...
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn secondary"
            onClick={onClose}
            disabled={isProcessing}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            className="btn primary"
            onClick={handlePayment}
            disabled={isProcessing || txHash}
            style={{ flex: 1 }}
          >
            {isProcessing ? '⏳ Processing...' : txHash ? '✅ Paid' : '💳 Pay Now'}
          </button>
        </div>

        <p className="muted" style={{ 
          fontSize: 12, 
          marginTop: 16, 
          marginBottom: 0,
          textAlign: 'center'
        }}>
          🔐 Payment is held in escrow until session ends
        </p>
      </div>
    </div>
  );
}
