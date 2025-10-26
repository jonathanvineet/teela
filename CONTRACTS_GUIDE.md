# 🔐 TEELA Smart Contracts Guide

## 📋 Overview

TEELA uses two integrated smart contracts:

1. **MultiAgentEscrow** - Handles payments to multiple agents
2. **AgentScoringSystem** - Tracks agent performance scores (auto-triggered)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER PAYS FOR SESSION                     │
│                            ↓                                 │
│                  ┌──────────────────┐                        │
│                  │ MultiAgentEscrow │                        │
│                  │  (Holds Funds)   │                        │
│                  └──────────────────┘                        │
│                            ↓                                 │
│              Backend calls distributePayments()              │
│                            ↓                                 │
│         ┌──────────────────┴──────────────────┐             │
│         ↓                                      ↓             │
│  ┌──────────────┐                    ┌──────────────┐       │
│  │ Agent A Gets │                    │ Agent B Gets │       │
│  │   Payment    │                    │   Payment    │       │
│  └──────────────┘                    └──────────────┘       │
│         ↓                                      ↓             │
│         └──────────────────┬──────────────────┘             │
│                            ↓                                 │
│              AUTOMATICALLY TRIGGERS                          │
│                            ↓                                 │
│                  ┌──────────────────┐                        │
│                  │ AgentScoringSystem│                       │
│                  │ (Updates Scores) │                        │
│                  └──────────────────┘                        │
│                            ↓                                 │
│              Scores Updated On-Chain                         │
└─────────────────────────────────────────────────────────────┘
```

## 📄 Contract 1: MultiAgentEscrow

### Purpose
- Holds user payments in escrow
- Distributes to N agent wallets
- Automatically triggers scoring
- Collects platform fees

### Key Functions

#### `createRental(sessionId, durationHours)`
User creates a rental session and pays upfront.

```javascript
// User pays 0.01 ETH for 2 hours
await escrow.createRental("session_123", 2, {
  value: ethers.parseEther("0.01")
});
```

#### `distributePayments(rentalId, payments, descriptions, refundAmount, agentIds, scores)`
Backend distributes funds to multiple agents with scores.

```javascript
const payments = [
  { recipient: "0xAgent1...", amount: ethers.parseEther("0.003") },
  { recipient: "0xAgent2...", amount: ethers.parseEther("0.005") }
];

const descriptions = [
  "Financial Agent - Session 123",
  "Legal Agent - Session 123"
];

const agentIds = ["financial_agent", "legal_agent"];
const scores = [85, 92]; // 0-100 scale

await escrow.distributePayments(
  rentalId,
  payments,
  descriptions,
  ethers.parseEther("0.002"), // refund
  agentIds,
  scores
);

// ✅ Payments sent
// ✅ Scores automatically updated
```

### Events
- `RentalCreated` - New session started
- `MultiPaymentReleased` - Payments distributed
- `PaymentDistributed` - Individual payment sent
- `RefundIssued` - Refund sent to user

---

## 📊 Contract 2: AgentScoringSystem

### Purpose
- Tracks agent performance scores
- Maintains leaderboard
- Uses separate ETH balance for gas
- Called automatically by escrow

### Key Features

#### Automatic Score Updates
When escrow distributes payments, it automatically calls:
```solidity
scoringSystem.batchUpdateScores(
  rentalId,
  agentIds,
  scores,
  revenues,
  sessionId
);
```

#### Separate Operational Balance
The scoring contract has its own ETH balance (funded by you) to pay for gas:

```javascript
// Fund with 0.1 ETH for operations
await deployer.sendTransaction({
  to: scoringAddress,
  value: ethers.parseEther("0.1")
});
```

Each score update deducts ~0.0001 ETH from operational balance.

### Key Functions

#### `getAgentScore(agentId)`
Get agent's performance metrics.

```javascript
const [owner, totalScore, sessions, revenue, avgScore, lastUpdated, isActive] 
  = await scoringSystem.getAgentScore("financial_agent");

console.log(`Average Score: ${avgScore}/100`);
console.log(`Total Sessions: ${sessions}`);
console.log(`Total Revenue: ${ethers.formatEther(revenue)} ETH`);
```

#### `getLeaderboard(count)`
Get top N agents by average score.

```javascript
const [agentIds, scores, sessions] = await scoringSystem.getLeaderboard(10);

// Top 10 agents
for (let i = 0; i < agentIds.length; i++) {
  console.log(`#${i+1}: ${agentIds[i]} - Score: ${scores[i]}/100`);
}
```

#### `depositOperationalFunds()`
Add more ETH for gas fees.

```javascript
await scoringSystem.depositOperationalFunds({
  value: ethers.parseEther("0.05")
});
```

### Events
- `ScoreUpdated` - Agent score updated
- `LeaderboardUpdated` - Leaderboard changed
- `OperationalFundsDeposited` - Gas funds added

---

## 🚀 Deployment

### Step 1: Compile Contracts
```bash
npx hardhat compile
```

### Step 2: Deploy Both Contracts
```bash
npx hardhat run scripts/deploy-integrated-system.js --network sepolia
```

This will:
1. Deploy AgentScoringSystem
2. Deploy MultiAgentEscrow
3. Connect them together
4. Fund scoring contract with 0.1 ETH

### Step 3: Save Contract Addresses
You'll get output like:
```
MultiAgentEscrow:      0x1234...
AgentScoringSystem:    0x5678...
```

---

## 💡 Usage Flow

### 1. User Starts Session
```javascript
// Frontend: User pays for session
const tx = await escrow.createRental("session_abc", 2, {
  value: ethers.parseEther("0.01")
});
const receipt = await tx.wait();
const rentalId = receipt.events[0].args.rentalId;
```

### 2. User Chats with Agents
```javascript
// Your application logic
// User interacts with multiple agents
// You track which agents were used and their performance
```

### 3. Backend Distributes Payments
```javascript
// Backend: After session ends
const payments = [
  { recipient: agentA_wallet, amount: ethers.parseEther("0.003") },
  { recipient: agentB_wallet, amount: ethers.parseEther("0.005") }
];

const agentIds = ["agent_a", "agent_b"];
const scores = [88, 95]; // Based on user feedback/usage

await escrow.distributePayments(
  rentalId,
  payments,
  ["Agent A", "Agent B"],
  refundAmount,
  agentIds,
  scores
);

// ✅ Payments sent to agents
// ✅ Scores automatically updated on-chain
// ✅ Leaderboard updated
```

### 4. Display Scores
```javascript
// Frontend: Show agent scores
const [, , , , avgScore] = await scoringSystem.getAgentScore("agent_a");
console.log(`Agent A Score: ${avgScore}/100`);
```

---

## 🔧 Configuration

### Update Trusted Backend
```javascript
await escrow.updateTrustedBackend(newBackendAddress);
```

### Update Scoring Contract
```javascript
await escrow.updateScoringContract(newScoringAddress);
```

### Check Operational Balance
```javascript
const [operational, total] = await scoringSystem.getBalances();
console.log(`Operational: ${ethers.formatEther(operational)} ETH`);

// Top up if low
if (operational < ethers.parseEther("0.01")) {
  await scoringSystem.depositOperationalFunds({
    value: ethers.parseEther("0.1")
  });
}
```

---

## 📊 Monitoring

### Track Payments
```javascript
// Listen for payment events
escrow.on("PaymentDistributed", (rentalId, recipient, amount, reason) => {
  console.log(`Payment: ${ethers.formatEther(amount)} ETH to ${recipient}`);
  console.log(`Reason: ${reason}`);
});
```

### Track Score Updates
```javascript
// Listen for score updates
scoringSystem.on("ScoreUpdated", (rentalId, agentId, score, revenue, avgScore) => {
  console.log(`${agentId} scored ${score}/100`);
  console.log(`New average: ${avgScore}/100`);
});
```

---

## 🛡️ Security Features

### Escrow Contract
- ✅ Only trusted backend can distribute
- ✅ Platform owner controls
- ✅ Grace period for cancellations
- ✅ Emergency refund mechanism

### Scoring Contract
- ✅ Only escrow can update scores
- ✅ Separate operational balance
- ✅ Non-critical (won't block payments)
- ✅ Platform owner controls

---

## 💰 Gas Costs

### Typical Costs (Sepolia/Mainnet)
- Create Rental: ~50,000 gas
- Distribute to 2 agents: ~150,000 gas
- Score update (automatic): ~80,000 gas (paid from operational balance)

### Operational Balance Usage
- Each score update: ~0.0001 ETH
- 0.1 ETH = ~1000 score updates
- Monitor and top up as needed

---

## 🔗 Contract Addresses

After deployment, save these:

```javascript
// contracts/config.js
export const MULTI_ESCROW_ADDRESS = "0x..."; // From deployment
export const SCORING_SYSTEM_ADDRESS = "0x..."; // From deployment
```

---

## 📝 Next Steps

1. ✅ Deploy contracts using the script
2. ✅ Save contract addresses
3. ✅ Update backend with addresses
4. ✅ Integrate payment distribution
5. ✅ Monitor operational balance
6. ✅ Display scores in frontend

---

## 🆘 Troubleshooting

### Scoring Not Working?
```javascript
// Check if scoring contract is set
const scoringAddr = await escrow.scoringContract();
console.log("Scoring contract:", scoringAddr);

// Check operational balance
const [operational] = await scoringSystem.getBalances();
console.log("Operational balance:", ethers.formatEther(operational));
```

### Payment Failed?
- Check rental is active
- Verify total distribution <= rental amount
- Ensure backend is authorized

---

## 📚 Additional Resources

- Hardhat Docs: https://hardhat.org/docs
- Ethers.js Docs: https://docs.ethers.org/
- Sepolia Faucet: https://sepoliafaucet.com/

---

**Ready to deploy? Run:**
```bash
npx hardhat run scripts/deploy-integrated-system.js --network sepolia
```
