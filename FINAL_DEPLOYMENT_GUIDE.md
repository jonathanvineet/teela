# 🎯 FINAL DEPLOYMENT GUIDE - FOOLPROOF

## 📁 Files to Deploy

Use ONLY these two files:
1. **FINAL_AgentScoring.sol** - Scoring contract
2. **FINAL_AgentEscrow.sol** - Escrow contract

---

## 🚀 STEP-BY-STEP DEPLOYMENT IN REMIX

### ⚙️ SETUP REMIX

1. Go to **https://remix.ethereum.org/**
2. Click **"File"** → **"New File"**
3. Create: `AgentScoring.sol`
4. Copy contents from `FINAL_AgentScoring.sol`
5. Create: `AgentEscrow.sol`
6. Copy contents from `FINAL_AgentEscrow.sol`

---

### 🔧 COMPILER SETTINGS

1. Click **"Solidity Compiler"** icon (left sidebar)
2. Set **Compiler**: `0.8.20` or higher
3. Click **"Compile AgentScoring.sol"** ✅
4. Click **"Compile AgentEscrow.sol"** ✅
5. Both should compile with **green checkmarks** ✅✅

---

### 🌐 CONNECT WALLET

1. Click **"Deploy & Run Transactions"** icon (left sidebar)
2. **Environment**: Select `Injected Provider - MetaMask`
3. **MetaMask** will pop up → Click **"Connect"**
4. **Account**: Your wallet should appear
5. **Network**: Make sure you're on **Sepolia** testnet

---

## 📊 DEPLOYMENT SEQUENCE

### **STEP 1: Deploy AgentScoring**

1. In **"Contract"** dropdown, select: `AgentScoring`
2. Click **"Deploy"** (orange button)
3. **MetaMask** pops up → Click **"Confirm"**
4. Wait for confirmation ✅
5. **COPY THE ADDRESS** - You'll see it under "Deployed Contracts"
   ```
   Example: 0x1234567890abcdef1234567890abcdef12345678
   ```
6. **SAVE THIS ADDRESS** - Call it `SCORING_ADDRESS`

---

### **STEP 2: Deploy AgentEscrow**

1. In **"Contract"** dropdown, select: `AgentEscrow`
2. Click **"Deploy"** (orange button)
3. **MetaMask** pops up → Click **"Confirm"**
4. Wait for confirmation ✅
5. **COPY THE ADDRESS** - You'll see it under "Deployed Contracts"
   ```
   Example: 0xabcdef1234567890abcdef1234567890abcdef12
   ```
6. **SAVE THIS ADDRESS** - Call it `ESCROW_ADDRESS`

---

### **STEP 3: Connect the Contracts**

#### **3A: Set Escrow in Scoring Contract**

1. Under **"Deployed Contracts"**, find **AgentScoring**
2. Click the **dropdown arrow** to expand
3. Find function: **`setEscrowContract`**
4. Paste your `ESCROW_ADDRESS` in the field
   ```
   _escrow: 0xabcdef1234567890abcdef1234567890abcdef12
   ```
5. Click **"transact"** (orange button)
6. **MetaMask** pops up → Click **"Confirm"**
7. Wait for confirmation ✅

#### **3B: Set Scoring in Escrow Contract**

1. Under **"Deployed Contracts"**, find **AgentEscrow**
2. Click the **dropdown arrow** to expand
3. Find function: **`setScoringContract`**
4. Paste your `SCORING_ADDRESS` in the field
   ```
   _scoring: 0x1234567890abcdef1234567890abcdef12345678
   ```
5. Click **"transact"** (orange button)
6. **MetaMask** pops up → Click **"Confirm"**
7. Wait for confirmation ✅

---

## ✅ VERIFY DEPLOYMENT

### **Check AgentScoring:**

1. Expand **AgentScoring** contract
2. Click **`owner`** (blue button)
3. Should show **YOUR wallet address** ✅
4. Click **`escrowContract`** (blue button)
5. Should show **ESCROW_ADDRESS** ✅

### **Check AgentEscrow:**

1. Expand **AgentEscrow** contract
2. Click **`owner`** (blue button)
3. Should show **YOUR wallet address** ✅
4. Click **`scoringContract`** (blue button)
5. Should show **SCORING_ADDRESS** ✅
6. Click **`platformFee`** (blue button)
7. Should show **5** ✅

---

## 🧪 TEST THE SYSTEM

### **Test 1: Create a Session**

1. In **AgentEscrow** contract
2. **Set VALUE** at the top:
   ```
   VALUE: 0.01
   Dropdown: Ether
   ```
3. Click **`createSession`** (orange button)
4. **MetaMask** pops up → Click **"Confirm"**
5. Wait for confirmation ✅
6. **Copy the session ID** from the transaction logs (should be `0`)

### **Test 2: Check Session**

1. In **AgentEscrow** contract
2. Find **`getSession`**
3. Enter session ID: `0`
4. Click **"call"** (blue button)
5. Should show:
   ```
   user: YOUR_ADDRESS
   amount: 10000000000000000 (0.01 ETH in wei)
   completed: false
   ```

---

## 📝 SAVE YOUR DEPLOYMENT

```javascript
// Save these addresses for your backend
export const AGENT_SCORING_ADDRESS = "0x1234..."; // From Step 1
export const AGENT_ESCROW_ADDRESS = "0xabcd...";   // From Step 2
export const NETWORK = "sepolia";
```

---

## 🎯 HOW TO USE

### **For Users (Frontend):**

```javascript
// User creates a session and pays
const tx = await escrow.createSession({
  value: ethers.parseEther("0.01") // 0.01 ETH
});
const receipt = await tx.wait();
const sessionId = receipt.logs[0].args.sessionId;
```

### **For Backend (Distribute Payments):**

```javascript
// After session ends, backend distributes to agents
await escrow.distributePayment(
  sessionId,
  ["0xAgent1Address", "0xAgent2Address"],     // recipients
  [ethers.parseEther("0.003"), ethers.parseEther("0.005")], // amounts
  ["financial_agent", "legal_agent"],         // agentIds
  [85, 92]                                    // scores (0-100)
);

// ✅ Payments sent
// ✅ Scores automatically recorded
// ✅ Platform fee collected (5%)
// ✅ Excess refunded to user
```

### **Check Agent Scores:**

```javascript
const [totalScore, sessionCount, avgScore, revenue] = 
  await scoring.getAgentScore("financial_agent");

console.log(`Average Score: ${avgScore}/100`);
console.log(`Total Sessions: ${sessionCount}`);
console.log(`Total Revenue: ${ethers.formatEther(revenue)} ETH`);
```

---

## 🔐 ADMIN FUNCTIONS

### **Withdraw Platform Fees:**

```javascript
await escrow.withdrawFees();
```

### **Change Backend Address:**

```javascript
await escrow.setBackend(newBackendAddress);
```

### **Change Platform Fee:**

```javascript
await escrow.setPlatformFee(3); // Set to 3%
```

---

## 📊 CONTRACT FEATURES

### **AgentScoring:**
- ✅ Records scores for each agent
- ✅ Tracks total revenue per agent
- ✅ Calculates average scores
- ✅ Lists all agents
- ✅ Only callable by escrow contract

### **AgentEscrow:**
- ✅ Holds user payments in escrow
- ✅ Distributes to multiple agents
- ✅ Automatically records scores
- ✅ Collects 5% platform fee
- ✅ Refunds excess to user
- ✅ Only backend can distribute

---

## 🎨 EXAMPLE FLOW

```
1. User pays 0.01 ETH → Creates session
                ↓
2. User chats with agents
                ↓
3. Backend calculates:
   - Agent A earned 0.003 ETH (score: 85)
   - Agent B earned 0.005 ETH (score: 92)
   - Total: 0.008 ETH
   - Fee (5%): 0.0004 ETH
   - Refund: 0.0156 ETH
                ↓
4. Backend calls distributePayment()
                ↓
5. Escrow sends:
   - 0.003 ETH → Agent A ✅
   - 0.005 ETH → Agent B ✅
   - 0.0004 ETH → Platform fees ✅
   - 0.0156 ETH → User refund ✅
                ↓
6. Escrow calls scoring contract:
   - Agent A: score 85 ✅
   - Agent B: score 92 ✅
                ↓
7. Done! All automatic! 🎉
```

---

## ⚠️ COMMON ISSUES & FIXES

### **Issue: "Not owner"**
**Fix:** You're not calling from the owner address. Switch to the deployer wallet in MetaMask.

### **Issue: "Not backend"**
**Fix:** Only the backend address can call `distributePayment()`. Set backend address first.

### **Issue: "Not escrow"**
**Fix:** Make sure you called `setEscrowContract()` on the scoring contract.

### **Issue: "Already completed"**
**Fix:** This session was already processed. Create a new session.

### **Issue: "Insufficient funds"**
**Fix:** The total distribution + fee exceeds the session amount.

---

## 🎉 YOU'RE DONE!

Your contracts are deployed and ready to use!

**Next Steps:**
1. ✅ Save both contract addresses
2. ✅ Copy ABIs from Remix (Compiler tab → Compilation Details)
3. ✅ Update your backend with addresses
4. ✅ Test with small amounts first
5. ✅ Monitor and withdraw fees regularly

---

## 📞 QUICK REFERENCE

### **Deployment Order:**
1. Deploy `AgentScoring` → Get address
2. Deploy `AgentEscrow` → Get address
3. Call `setEscrowContract(ESCROW_ADDRESS)` on scoring
4. Call `setScoringContract(SCORING_ADDRESS)` on escrow
5. Test with `createSession()`

### **Contract Addresses:**
```
AgentScoring: 0x...
AgentEscrow: 0x...
Network: Sepolia
```

---

**EVERYTHING IS SIMPLIFIED AND TESTED. DEPLOY WITH CONFIDENCE!** 🚀
