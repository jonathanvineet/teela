import { ParticleCard } from './MagicBento'

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

export default function TeelaDomains({ onSelectDomain }) {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 42, margin: '0 0 12px' }}>Teela AI Orchestrator</h1>
        <p className="muted" style={{ fontSize: 18 }}>
          Select a domain to start chatting with specialized agents
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: 28,
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {DOMAINS.map((domain) => (
          <ParticleCard
            key={domain.id}
            className="glass colorful square"
            style={{ padding: 28, minHeight: 380 }}
            enableTilt={true}
            enableMagnetism={true}
            clickEffect={true}
            particleCount={8}
            glowColor="132, 0, 255"
          >
            <div>
              <img 
                className="card-thumb"
                src={domain.icon} 
                alt={domain.title}
                style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 12 }}
              />
              <h3>{domain.title}</h3>
              <p>{domain.description}</p>
              <div style={{ 
                fontSize: 16, 
                fontWeight: 600,
                color: '#00d4ff', 
                background: 'rgba(0, 212, 255, 0.1)', 
                padding: '8px 12px', 
                borderRadius: 8,
                textAlign: 'center',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                marginBottom: 8
              }}>
                💳 {domain.hourlyRate} ETH/hour
              </div>
              {domain.sensitive && (
                <div style={{ 
                  fontSize: 11, 
                  color: '#ff9800', 
                  background: 'rgba(255, 152, 0, 0.1)', 
                  padding: '4px 8px', 
                  borderRadius: 6,
                  textAlign: 'center',
                  marginBottom: 8
                }}>
                  ⚠️ May request sensitive information
                </div>
              )}
              <button 
                className="btn primary" 
                onClick={() => onSelectDomain(domain)}
              >
                Start Chat →
              </button>
            </div>
          </ParticleCard>
        ))}
      </div>
    </div>
  )
}
