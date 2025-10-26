# ⚡ QUICK DEPLOY CHECKLIST

## 📋 Pre-Deployment

- [ ] Open Remix: https://remix.ethereum.org/
- [ ] Create `AgentScoring.sol` (copy from FINAL_AgentScoring.sol)
- [ ] Create `AgentEscrow.sol` (copy from FINAL_AgentEscrow.sol)
- [ ] Compile both (Compiler 0.8.20+)
- [ ] Connect MetaMask (Sepolia testnet)
- [ ] Have some Sepolia ETH for gas

---

## 🚀 Deployment Steps

### 1️⃣ Deploy AgentScoring
```
Contract: AgentScoring
Click: Deploy
Confirm in MetaMask
Copy address → SCORING_ADDRESS
```

### 2️⃣ Deploy AgentEscrow
```
Contract: AgentEscrow
Click: Deploy
Confirm in MetaMask
Copy address → ESCROW_ADDRESS
```

### 3️⃣ Connect Contracts
```
AgentScoring.setEscrowContract(ESCROW_ADDRESS)
AgentEscrow.setScoringContract(SCORING_ADDRESS)
```

---

## ✅ Verify

```
AgentScoring.owner() = YOUR_ADDRESS ✅
AgentScoring.escrowContract() = ESCROW_ADDRESS ✅
AgentEscrow.owner() = YOUR_ADDRESS ✅
AgentEscrow.scoringContract() = SCORING_ADDRESS ✅
AgentEscrow.platformFee() = 5 ✅
```

---

## 🧪 Test

```
Set VALUE: 0.01 Ether
AgentEscrow.createSession()
Confirm in MetaMask
Check session: getSession(0)
```

---

## 💾 Save

```javascript
SCORING_ADDRESS = "0x..."
ESCROW_ADDRESS = "0x..."
NETWORK = "sepolia"
```

---

## 🎯 Done!

Your contracts are live and ready to use! 🎉

See **FINAL_DEPLOYMENT_GUIDE.md** for detailed instructions.
