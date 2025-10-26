// Contract addresses on Sepolia
export const AGENT_SCORING_ADDRESS = "0xbD3616c1c430054eD01c1E083742ddFD3b7DeA81";
export const AGENT_ESCROW_ADDRESS = "0x177994988621cF33676CFAE86A9176e553c1D879";
export const NETWORK = "sepolia";
export const CHAIN_ID = 11155111;

// Agent Escrow ABI
export const ESCROW_ABI = [
  "function createSession() external payable returns (uint256)",
  "function getSession(uint256 sessionId) external view returns (address user, uint256 amount, uint256 startTime, bool completed)",
  "function owner() external view returns (address)",
  "function backend() external view returns (address)",
  "function platformFee() external view returns (uint256)",
  "event SessionCreated(uint256 sessionId, address user, uint256 amount)"
];

// Agent Scoring ABI
export const SCORING_ABI = [
  "function getAgentScore(string memory agentId) external view returns (uint256 totalScore, uint256 sessionCount, uint256 averageScore, uint256 totalRevenue)",
  "function getAllAgents() external view returns (string[] memory)",
  "function getAgentCount() external view returns (uint256)"
];

// Hourly rates for each domain (in ETH)
export const DOMAIN_RATES = {
  finance: "0.002",      // 0.002 ETH per hour
  legal: "0.003",        // 0.003 ETH per hour
  medical: "0.0025",     // 0.0025 ETH per hour
  education: "0.002",    // 0.002 ETH per hour
  technology: "0.0025",  // 0.0025 ETH per hour
  mentalwellness: "0.002" // 0.002 ETH per hour
};

// Default session duration (1 hour)
export const DEFAULT_SESSION_HOURS = 1;
