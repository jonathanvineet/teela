# 🎯 Agent Rental System - Complete Implementation Guide

## 📋 Overview

The Agent Rental Escrow system allows users to pay hourly fees to chat with specific agents. Payments are held in escrow and automatically released to agent owners after sessions end.

---

## 📁 Files Created

### 1. **Smart Contract**
- `contracts/AgentRentalEscrow.sol` - Main escrow contract

### 2. **UI Components**
- `src/RentalPayment.jsx` - Payment interface for starting rentals
- `src/RentalSession.jsx` - Active session display with timer

### 3. **Configuration**
- `agents/agents_registry.json` - Updated with `hourlyRate` field

---

## 🚀 Deployment Steps

### Step 1: Deploy the Smart Contract

```bash
cd contracts

# Install dependencies (if not already done)
npm install

# Deploy to your network (Sepolia, Base, etc.)
npx hardhat run scripts/deploy-escrow.js --network sepolia
```

**Create `scripts/deploy-escrow.js`:**

```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying AgentRentalEscrow...");
  
  const AgentRentalEscrow = await hre.ethers.getContractFactory("AgentRentalEscrow");
  const escrow = await AgentRentalEscrow.deploy();
  
  await escrow.waitForDeployment();
  const address = await escrow.getAddress();
  
  console.log("✅ AgentRentalEscrow deployed to:", address);
  
  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    address: address,
    network: hre.network.name,
    deployer: (await hre.ethers.getSigners())[0].address,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(
    'escrow-deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("📝 Deployment info saved to escrow-deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Step 2: Get the Contract ABI

After deployment, get the ABI from:
```bash
cat artifacts/contracts/AgentRentalEscrow.sol/AgentRentalEscrow.json | jq '.abi' > escrow-abi.json
```

---

## 🔧 UI Integration

### Step 1: Update Contract Address and ABI

In `src/RentalPayment.jsx` (line 15-16):
```javascript
const ESCROW_ADDRESS = '0xYOUR_DEPLOYED_CONTRACT_ADDRESS'
const ESCROW_ABI = [ /* paste ABI here */ ]
```

In `src/RentalSession.jsx` (line 14-15):
```javascript
const ESCROW_ADDRESS = '0xYOUR_DEPLOYED_CONTRACT_ADDRESS'
const ESCROW_ABI = [ /* paste ABI here */ ]
```

### Step 2: Register Agents in Contract

Each agent owner must register their agent with an hourly rate:

```javascript
// Example: Register agent with 0.002 ETH/hour rate
await escrowContract.registerAgent(
  "adv-financial-agent",  // agentId
  parseEther("0.002")     // hourlyRate in wei
);
```

### Step 3: Update Agent Data

Make sure each agent in `agents_registry.json` has:
```json
{
  "agent_id": "adv-financial-agent",
  "name": "Financial Advisor",
  "hourlyRate": "0.002",
  "wallet": "0x...",
  "domain": "financial",
  "speciality": "Financial Advisory"
}
```

### Step 4: Integrate into AgentsList

Update `src/AgentsList.jsx` to show rental option:

```jsx
import RentalPayment from './RentalPayment'
import RentalSession from './RentalSession'

function AgentCard({ agent }) {
  const [showRental, setShowRental] = useState(false)
  const [activeRental, setActiveRental] = useState(null)
  
  return (
    <div className="agent-card">
      <h3>{agent.name}</h3>
      <p>Rate: {agent.hourlyRate} ETH/hour</p>
      
      {!activeRental && !showRental && (
        <button onClick={() => setShowRental(true)}>
          💳 Rent Agent
        </button>
      )}
      
      {showRental && !activeRental && (
        <RentalPayment 
          agent={agent}
          onPaymentSuccess={(rental) => {
            setActiveRental(rental)
            setShowRental(false)
          }}
          onCancel={() => setShowRental(false)}
        />
      )}
      
      {activeRental && (
        <RentalSession 
          rental={activeRental}
          agent={agent}
          onSessionEnd={() => setActiveRental(null)}
        />
      )}
    </div>
  )
}
```

---

## 💰 How It Works

### User Flow:

1. **Select Agent** → User clicks "Rent Agent"
2. **Choose Hours** → User selects 1-24 hours
3. **Pay** → User pays (e.g., 0.002 ETH × 2 hours = 0.004 ETH)
4. **Escrow** → Funds locked in contract
5. **Timer Starts** → Session begins, countdown timer shows
6. **Chat** → User can now chat with agent
7. **End Session** → User clicks "End Session"
8. **Refund** → Unused time refunded automatically
9. **Payment Released** → Agent owner receives payment (minus 5% platform fee)

### Example:
```
User pays for 3 hours @ 0.002 ETH/hour = 0.006 ETH
Uses only 1.5 hours
Refund: 1.5 hours × 0.002 = 0.003 ETH
Agent owner receives: (1.5 × 0.002) × 0.95 = 0.00285 ETH
Platform fee: 0.00015 ETH
```

---

## 🎨 UI Features

### RentalPayment Component:
- ✅ Hour selector (1-24 hours)
- ✅ Real-time cost calculation
- ✅ Platform fee display (5%)
- ✅ Wallet connection check
- ✅ Transaction status
- ✅ Escrow explanation

### RentalSession Component:
- ✅ Live countdown timer (HH:MM:SS)
- ✅ Progress bar
- ✅ Time used vs. time remaining
- ✅ Estimated refund calculator
- ✅ "End Session" button
- ✅ Auto-complete when expired
- ✅ Visual status indicators

---

## 🔐 Contract Features

### Security:
- ✅ Funds held in escrow
- ✅ Only renter can end session
- ✅ Auto-complete after expiry
- ✅ 5-minute grace period for cancellations
- ✅ Partial refunds for unused time
- ✅ Platform fee (5%, max 10%)

### Functions:

**For Agent Owners:**
- `registerAgent(agentId, hourlyRate)` - Register agent
- `updateAgent(agentId, newRate, isActive)` - Update rate/status

**For Users:**
- `startRental(agentId, hours)` - Pay and start session
- `completeRental(rentalId, hoursUsed)` - End and get refund
- `cancelRental(rentalId)` - Cancel within 5 min grace period

**For Platform:**
- `withdrawPlatformFees()` - Withdraw collected fees
- `updatePlatformFee(newPercent)` - Update fee (max 10%)

**View Functions:**
- `getAgent(agentId)` - Get agent details
- `getRental(rentalId)` - Get rental details
- `isRentalActive(rentalId)` - Check if active
- `getRemainingTime(rentalId)` - Get time left
- `getUserRentals(user)` - Get user's history
- `getAgentRentals(agentId)` - Get agent's history

---

## 📊 Events

The contract emits events for tracking:

```solidity
event AgentRegistered(string indexed agentId, address indexed owner, uint256 hourlyRate);
event RentalStarted(uint256 indexed rentalId, address indexed renter, string indexed agentId, uint256 hours, uint256 amount);
event RentalCompleted(uint256 indexed rentalId, uint256 hoursUsed, uint256 refundAmount);
event PaymentReleased(uint256 indexed rentalId, address indexed agentOwner, uint256 amount);
event RefundIssued(uint256 indexed rentalId, address indexed renter, uint256 amount);
```

---

## 🧪 Testing

### Test Scenarios:

1. **Full Session:**
   - Pay for 2 hours
   - Wait 2 hours
   - Auto-complete releases full payment

2. **Early End:**
   - Pay for 3 hours
   - Use 1 hour
   - End session → Get 2 hours refunded

3. **Grace Period Cancel:**
   - Pay for 1 hour
   - Cancel within 5 minutes
   - Get full refund

4. **Multiple Agents:**
   - Rent Agent A @ 0.002 ETH/hour
   - Rent Agent B @ 0.005 ETH/hour
   - Both sessions active simultaneously

---

## 💡 Next Steps

After you deploy and provide the contract address and ABI:

1. I'll update the UI components with the correct values
2. I'll integrate the rental system into the main chat flow
3. I'll add backend endpoints to track active rentals
4. I'll add rental history to the Owner Dashboard

---

## 📝 Notes

- **Gas Optimization:** Contract uses minimal storage
- **Upgradability:** Consider using proxy pattern for future upgrades
- **Multi-chain:** Deploy to multiple networks for wider reach
- **Analytics:** Track rental metrics for insights
- **Notifications:** Add email/push notifications for session expiry

---

## 🎯 Summary

You now have:
1. ✅ Complete escrow smart contract (`AgentRentalEscrow.sol`)
2. ✅ Payment UI component (`RentalPayment.jsx`)
3. ✅ Session timer component (`RentalSession.jsx`)
4. ✅ Updated agent data structure
5. ✅ Deployment guide
6. ✅ Integration instructions

**Deploy the contract, send me the address and ABI, and I'll complete the integration!** 🚀
