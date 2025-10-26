# 🚀 REMIX IDE Deployment Guide

## 📋 Files to Use

Use these Remix-optimized contracts:
1. `AgentScoringSystem_Remix.sol`
2. `MultiAgentEscrow_Remix.sol`

---

## 🔧 Step-by-Step Deployment

### ⚙️ **Remix Setup**

1. Go to https://remix.ethereum.org/
2. Create new files and copy the contract code
3. **Compiler Settings:**
   - Compiler: `0.8.20` or higher
   - EVM Version: `paris` or `shanghai`
   - Enable Optimization: ✅ (200 runs)

---

### 📊 **STEP 1: Deploy AgentScoringSystem**

1. **Select Contract:** `AgentScoringSystem`
2. **Constructor Parameter:**
   ```
   _escrowContract: 0x0000000000000000000000000000000000000000
   ```
   *(Use zero address for now, we'll update it after deploying escrow)*

3. **Click Deploy** ✅

4. **Copy the deployed address:**
   ```
   AgentScoringSystem: 0xYourScoringAddress...
   ```

---

### 💰 **STEP 2: Deploy MultiAgentEscrow**

1. **Select Contract:** `MultiAgentEscrow`
2. **Constructor Parameters:**
   ```
   _trustedBackend: 0xYourWalletAddress (your current address)
   _scoringContract: 0xYourScoringAddress (from Step 1)
   ```

3. **Click Deploy** ✅

4. **Copy the deployed address:**
   ```
   MultiAgentEscrow: 0xYourEscrowAddress...
   ```

---

### 🔗 **STEP 3: Connect the Contracts**

1. **Go to AgentScoringSystem contract**
2. **Find function:** `updateEscrowContract`
3. **Parameters:**
   ```
   newEscrow: 0xYourEscrowAddress (from Step 2)
   ```
4. **Click transact** ✅

---

### 💵 **STEP 4: Fund Scoring Contract**

1. **In Remix, set VALUE:**
   ```
   Value: 0.1
   Unit: Ether
   ```

2. **Go to AgentScoringSystem contract**
3. **Find function:** `depositOperationalFunds`
4. **Click transact** ✅

5. **Verify funding:**
   - Call `getBalances()`
   - Should show: `operational: 100000000000000000` (0.1 ETH in wei)

---

## ✅ Verification Checklist

After deployment, verify everything works:

### **Check AgentScoringSystem:**
```
✅ platformOwner() = Your address
✅ escrowContract() = MultiAgentEscrow address
✅ operationalBalance() = 100000000000000000 (0.1 ETH)
✅ leaderboardSize() = 10
```

### **Check MultiAgentEscrow:**
```
✅ platformOwner() = Your address
✅ trustedBackend() = Your address
✅ scoringContract() = AgentScoringSystem address
✅ platformFeePercent() = 5
```

---

## 📝 Save Your Addresses

```javascript
// Save these for your application
export const MULTI_ESCROW_ADDRESS = "0x..."; // From Step 2
export const SCORING_SYSTEM_ADDRESS = "0x..."; // From Step 1

// Network
export const NETWORK = "sepolia"; // or "mainnet"
```

---

## 🧪 Test the Deployment

### **Test 1: Create a Rental**

1. **In MultiAgentEscrow, set VALUE:**
   ```
   Value: 0.01
   Unit: Ether
   ```

2. **Call `createRental`:**
   ```
   sessionId: "test_session_1"
   durationHours: 2
   ```

3. **Click transact** ✅
4. **Check events** - Should see `RentalCreated`

### **Test 2: Distribute Payments (Backend Only)**

This requires calling from the trusted backend address.

---

## 🎯 Common Issues & Solutions

### **Issue: "Contract may be abstract"**
**Solution:** 
- Make sure compiler version is `0.8.20` or higher
- Enable optimization
- Use the `_Remix.sol` versions

### **Issue: "Gas estimation failed"**
**Solution:**
- Increase gas limit manually
- Check you have enough ETH in wallet
- Verify all parameters are correct

### **Issue: "Only escrow contract"**
**Solution:**
- Make sure you called `updateEscrowContract()` in Step 3
- Verify the address is correct

### **Issue: "Insufficient operational funds"**
**Solution:**
- Fund the scoring contract (Step 4)
- Call `depositOperationalFunds()` with ETH

---

## 📊 Contract ABIs

After deployment, get ABIs from Remix:

1. **Compiler tab** → **Compilation Details**
2. **Copy ABI** for each contract
3. Save to your frontend:

```javascript
// src/contracts/MultiAgentEscrow.js
export const MULTI_ESCROW_ABI = [...]; // Paste ABI here
export const MULTI_ESCROW_ADDRESS = "0x...";

// src/contracts/AgentScoringSystem.js
export const SCORING_SYSTEM_ABI = [...]; // Paste ABI here
export const SCORING_SYSTEM_ADDRESS = "0x...";
```

---

## 🔐 Security Notes

1. **Change trustedBackend** after testing:
   ```javascript
   await escrow.updateTrustedBackend(productionBackendAddress);
   ```

2. **Monitor operational balance:**
   ```javascript
   const [operational] = await scoring.getBalances();
   if (operational < ethers.parseEther("0.01")) {
     // Top up!
   }
   ```

3. **Withdraw platform fees regularly:**
   ```javascript
   await escrow.withdrawPlatformFees();
   ```

---

## 🎉 You're Done!

Your contracts are now deployed and ready to use!

**Next Steps:**
1. ✅ Save contract addresses
2. ✅ Copy ABIs to frontend
3. ✅ Update backend with addresses
4. ✅ Test with small amounts first
5. ✅ Monitor operational balance

---

## 📞 Need Help?

If you encounter issues:
1. Check Remix console for error messages
2. Verify all addresses are correct
3. Ensure you have enough ETH for gas
4. Check that operational balance is funded

**Happy Deploying! 🚀**
