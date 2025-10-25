# TEELA Smart Contracts

This directory contains smart contracts for the TEELA AI Agent platform.

## Contracts

### 1. AgentRegistry.sol
Manages the registration and tracking of AI agents on-chain.

**Features:**
- Register agents with metadata (name, address, speciality, domain)
- Track agent ownership by wallet address
- Query agents by domain or owner
- Update agent information
- Activate/deactivate agents

### 2. AgentRentalEscrow.sol (NEW)
Escrow contract for hourly agent rentals with automatic payment handling.

**Features:**
- Pay-per-hour agent access (e.g., 0.002 ETH/hour)
- Funds held in escrow during rental period
- Automatic payment release to agent owner after session
- Partial refunds for unused time
- 5% platform fee
- Grace period for cancellations (5 minutes)
- Auto-complete after rental expires
- Track earnings and rental history

## Deployment

1. Install dependencies:
```bash
cd contracts
npm install
```

2. Set environment variables in `.env`:
```
PRIVATE_KEY=your_private_key_here
WEB3_PROVIDER_URL=your_rpc_url_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

3. Deploy to network:
```bash
# Deploy to localhost (requires running hardhat node)
npx hardhat run scripts/deploy.js --network localhost

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia
```

4. The contract address and ABI will be saved to `deployment-info.json`

## Contract Functions

- `registerAgent()` - Register a new agent
- `updateAgent()` - Update agent information
- `getAgent()` - Get agent details
- `getOwnerAgents()` - Get all agents owned by an address
- `getAgentsByDomain()` - Get agents in a specific domain
