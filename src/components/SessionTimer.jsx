import { useState, useEffect } from 'react';
import TimerIcon from './TimerIcon';

export function SessionTimer({ session, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!session || !session.startTime) return;

    const calculateTimeLeft = () => {
      const now = Date.now();
      const sessionStart = session.startTime;
      const sessionEnd = sessionStart + (60 * 60 * 1000); // 1 hour in milliseconds
      const remaining = sessionEnd - now;

      if (remaining <= 0) {
        setIsExpired(true);
        setTimeLeft(0);
        if (onExpire) onExpire();
        return 0;
      }

      return remaining;
    };

    // Initial calculation
    const initial = calculateTimeLeft();
    setTimeLeft(initial);

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [session, onExpire]);

  if (!session || timeLeft === null) return null;

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getDomainName = () => {
    const domainNames = {
      'financial': 'Financial Advice',
      'legal': 'Legal Consultation',
      'medical': 'Medical Consultation',
      'education': 'Education Planning',
      'technology': 'Technology Consulting',
      'mentalwellness': 'Mental Wellness'
    };
    return domainNames[session?.domain] || session?.domain || 'Unknown';
  };

  const getProgress = () => {
    if (!timeLeft || isExpired) return 0;
    const totalTime = 60 * 60 * 1000; // 1 hour
    return (timeLeft / totalTime) * 100;
  };

  const progress = getProgress();
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div style={{ position: 'relative' }}>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          position: 'relative',
          width: 48,
          height: 48,
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        {/* Background circle (grey) */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: 'rotate(-90deg)'
          }}
        >
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="3"
          />
          {/* Progress circle (white) */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke={isExpired ? '#ff6b6b' : '#ffffff'}
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1s linear'
            }}
          />
        </svg>
        
        {/* Timer icon in center */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}>
          <TimerIcon 
            size={20} 
            color={isExpired ? '#ff6b6b' : '#ffffff'}
            strokeWidth={2}
          />
        </div>
      </div>

      {isExpanded && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 12,
          background: 'rgba(20, 20, 20, 0.98)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
          padding: 20,
          minWidth: 300,
          zIndex: 1000,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
        }}>
          {/* Header with circular progress */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 16,
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  transform: 'rotate(-90deg)'
                }}
              >
                <circle
                  cx="30"
                  cy="30"
                  r="26"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="4"
                />
                <circle
                  cx="30"
                  cy="30"
                  r="26"
                  fill="none"
                  stroke={isExpired ? '#ff6b6b' : '#ffffff'}
                  strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 26}
                  strokeDashoffset={2 * Math.PI * 26 - (progress / 100) * 2 * Math.PI * 26}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: 14,
                fontWeight: 700,
                color: isExpired ? '#ff6b6b' : '#ffffff'
              }}>
                {Math.round(progress)}%
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Rental</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                {getDomainName()}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: isExpired ? '#ff6b6b' : '#ffffff' }}>
                {isExpired ? 'Expired' : formatTime(timeLeft)}
              </div>
            </div>
          </div>

          {/* Details */}
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 12px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <span style={{ fontSize: 13, color: '#999' }}>Amount Paid</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                {session?.amount || '0'} ETH
              </span>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 12px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <span style={{ fontSize: 13, color: '#999' }}>Session ID</span>
              <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#888' }}>
                #{session?.sessionId || 'N/A'}
              </span>
            </div>
          </div>

          {isExpired && (
            <div style={{
              marginTop: 16,
              padding: 12,
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: 8,
              fontSize: 12,
              color: '#ff6b6b',
              textAlign: 'center',
              fontWeight: 500
            }}>
              ⚠️ Session expired - Payment required to continue
            </div>
          )}
        </div>
      )}
    </div>
  );
}
