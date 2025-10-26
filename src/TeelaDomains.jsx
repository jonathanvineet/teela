import { ParticleCard } from './MagicBento'

function isPaidFor(domain, activeSession) {
  if (!activeSession || !activeSession.domain || !activeSession.startTime) {
    return false;
  }
  
  if (activeSession.domain !== domain.id) {
    return false;
  }
  
  const now = Date.now();
  const sessionEnd = activeSession.startTime + (60 * 60 * 1000);
  return now < sessionEnd;
}

const DOMAINS = [
  {
    id: 'financial',
    title: 'Financial Advice',
    description: 'Get expert advice on investments, savings, budgeting, and financial planning.',
    icon: '/images/finance.jpg',
    sensitive: true,
    hourlyRate: '0.002'  // ETH per hour
  },
  {
    id: 'legal',
    title: 'Legal Consultation',
    description: 'Legal guidance on contracts, compliance, and regulatory matters.',
    icon: '/images/legal.webp',
    sensitive: true,
    hourlyRate: '0.005'  // ETH per hour
  },
  {
    id: 'medical',
    title: 'Medical Consultation',
    description: 'Health advice, symptom analysis, and wellness recommendations.',
    icon: '/images/medical.jpg',
    sensitive: true,
    hourlyRate: '0.004'  // ETH per hour
  },
  {
    id: 'tax',
    title: 'Tax Advisory',
    description: 'Tax planning, deductions, filing assistance, and compliance.',
    icon: '/images/tax.jpg',
    sensitive: true,
    hourlyRate: '0.003'  // ETH per hour
  },
  {
    id: 'real-estate',
    title: 'Real Estate',
    description: 'Property investment, market analysis, and real estate planning.',
    icon: '/images/estate.jpg',
    sensitive: true,
    hourlyRate: '0.003'  // ETH per hour
  },
  {
    id: 'insurance',
    title: 'Insurance Planning',
    description: 'Coverage analysis, policy recommendations, and risk assessment.',
    icon: '/images/insurance.jpg',
    sensitive: true,
    hourlyRate: '0.002'  // ETH per hour
  },
  {
    id: 'career',
    title: 'Career Coaching',
    description: 'Career guidance, resume tips, interview prep, and job search strategies.',
    icon: '/images/career.jpeg',
    sensitive: true,
    hourlyRate: '0.001'  // ETH per hour
  },
  {
    id: 'mental-health',
    title: 'Mental Wellness',
    description: 'Emotional support, stress management, and mental health resources.',
    icon: '/images/AnyConv.com__mentalwellness.jpg',
    sensitive: true,
    hourlyRate: '0.003'  // ETH per hour
  },
  {
    id: 'education',
    title: 'Education Planning',
    description: 'Academic guidance, course selection, and educational financing.',
    icon: '/images/education.png',
    sensitive: true,
    hourlyRate: '0.001'  // ETH per hour
  }
]

export default function TeelaDomains({ onSelectDomain, activeSession }) {
  return (
    <div style={{ padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ 
          fontSize: 48, 
          fontWeight: 700,
          margin: '0 0 16px',
          background: 'linear-gradient(135deg, #fff 0%, #a78bfa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Teela AI Orchestrator
        </h1>
        <p style={{ 
          fontSize: 18, 
          color: 'rgba(255, 255, 255, 0.7)',
          margin: 0
        }}>
          Select a domain to start chatting with specialized agents
        </p>
      </div>

      {/* Cards Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: 32,
        maxWidth: '1300px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        {DOMAINS.map((domain) => {
          const paid = isPaidFor(domain, activeSession);
          return (
          <ParticleCard
            key={domain.id}
            className="glass colorful"
            style={{ 
              padding: 0,
              minHeight: 480,
              overflow: 'visible',
              display: 'block'
            }}
            enableTilt={true}
            enableMagnetism={true}
            clickEffect={true}
            particleCount={8}
            glowColor="132, 0, 255"
          >
            {/* Wrapper div to contain everything */}
            <div style={{ 
              position: 'relative',
              zIndex: 2,
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
              minHeight: 480
            }}>
              {/* Image Section */}
              <div style={{ 
                width: '100%', 
                height: 180,
                overflow: 'hidden',
                flexShrink: 0,
                position: 'relative'
              }}>
                <img 
                  src={domain.icon} 
                  alt={domain.title}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              </div>

              {/* Content Section */}
              <div style={{ 
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                flex: 1,
                position: 'relative',
                backgroundColor: 'transparent'
              }}>
                <h3 style={{ 
                  fontSize: 22, 
                  fontWeight: 600,
                  margin: '0 0 4px 0',
                  padding: 0,
                  color: '#fff',
                  lineHeight: 1.3
                }}>
                  {domain.title}
                </h3>
                
                <p style={{ 
                  fontSize: 14, 
                  lineHeight: 1.6, 
                  margin: '0 0 8px 0',
                  padding: 0,
                  color: 'rgba(255, 255, 255, 0.8)',
                  flex: 1
                }}>
                  {domain.description}
                </p>
                {/* Price Badge */}
                <div style={{ 
                  fontSize: 16, 
                  fontWeight: 600,
                  color: '#00d4ff', 
                  background: 'rgba(0, 212, 255, 0.15)', 
                  padding: '12px 16px', 
                  borderRadius: 8,
                  textAlign: 'center',
                  border: '1px solid rgba(0, 212, 255, 0.4)',
                  margin: 0
                }}>
                  💳 {domain.hourlyRate} ETH/hour
                </div>

                {/* Warning Badge */}
                {domain.sensitive && (
                  <div style={{ 
                    fontSize: 12, 
                    color: '#ff9800', 
                    background: 'rgba(255, 152, 0, 0.15)', 
                    padding: '8px 12px', 
                    borderRadius: 6,
                    textAlign: 'center',
                    border: '1px solid rgba(255, 152, 0, 0.4)',
                    margin: 0
                  }}>
                    ⚠️ May request sensitive information
                  </div>
                )}

                {/* Paid Badge */}
                {paid && (
                  <div style={{ 
                    fontSize: 13, 
                    fontWeight: 600,
                    color: '#51cf66', 
                    background: 'rgba(81, 207, 102, 0.15)', 
                    padding: '10px 14px', 
                    borderRadius: 6,
                    textAlign: 'center',
                    border: '1px solid rgba(81, 207, 102, 0.4)',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}>
                    ✅ Paid - Access Active
                  </div>
                )}

                {/* Button */}
                <button 
                  className="btn primary" 
                  onClick={() => onSelectDomain(domain)}
                  style={{ 
                    padding: '14px 24px', 
                    fontSize: 16, 
                    fontWeight: 600,
                    width: '100%',
                    margin: 0,
                    marginTop: 'auto'
                  }}
                >
                  {paid ? 'Continue Chat →' : 'Start Chat →'}
                </button>
              </div>
            </div>
          </ParticleCard>
          );
        })}
      </div>
    </div>
  )
}
