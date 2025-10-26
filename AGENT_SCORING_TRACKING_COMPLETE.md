# 📊 Agent Scoring & Session Tracking Complete!

## 🎯 What's Been Implemented

### **1. Session Usage Tracker** ✅
- Tracks agent usage per session
- Accumulates scores over iterations
- Calculates contribution percentages
- Balances low-performing agents
- Prepares data for contract submission

### **2. Cumulative Scoring** ✅
- Each agent scored out of 100
- Based on: Quality (40%), Speed (30%), Relevance (30%)
- Accumulated across all iterations
- Average calculated for final score

### **3. Fair Distribution** ✅
- Agents with < 5% contribution redistributed
- Low performers get minimum 2%
- Remaining distributed to high performers
- Ensures fair payment allocation

### **4. Contract Integration** ✅
- Prepares data for escrow distribution
- Prepares data for score recording
- Includes wallet addresses
- Calculates ETH amounts per agent

---

## 🔄 How It Works

### **Session Lifecycle:**

```
1. User pays → Session initialized
        ↓
2. User asks question → Agents respond
        ↓
3. Each agent scored (0-100)
        ↓
4. Usage recorded in session
        ↓
5. Contribution % calculated
        ↓
6. Repeat steps 2-5 for each question
        ↓
7. Timer expires → Get contract data
        ↓
8. Submit to escrow & scoring contracts
```

---

## 📊 Scoring System

### **Agent Score Calculation:**

```python
# Per iteration score (0-100)
score = (quality * 0.4 + speed * 0.3 + relevance * 0.3) * 100

# Quality (0-1):
- Response length appropriateness
- Actionability (steps, examples)
- Specificity (numbers, details)

# Speed (0-1):
- Response time
- Compared to average

# Relevance (0-1):
- Match to query intent
- Specialty alignment
```

### **Contribution Percentage:**

```python
# Weighted score per agent
weighted_score = usage_count * average_quality

# Contribution %
contribution = (weighted_score / total_weighted) * 100
```

---

## 🎯 Example Session

### **Session Start:**
```json
{
  "session_id": "1",
  "domain": "financial",
  "start_time": 1730000000,
  "total_iterations": 0,
  "agent_usage": {}
}
```

### **After 3 Questions:**

**Agent A (Financial Expert):**
- Used: 3 times
- Scores: [85, 90, 88]
- Average: 87.67/100
- Contribution: 45%

**Agent B (Investment Advisor):**
- Used: 2 times
- Scores: [75, 80]
- Average: 77.5/100
- Contribution: 35%

**Agent C (Tax Consultant):**
- Used: 1 time
- Scores: [70]
- Average: 70/100
- Contribution: 20%

### **Low Performer Example:**

**Agent D (General):**
- Used: 1 time
- Scores: [40]
- Average: 40/100
- Contribution: 3% → **Adjusted to 2%**
- Excess 1% redistributed to A, B, C

---

## 📡 API Endpoints

### **1. Get Session Summary**
```
GET /session/summary?session_id=1
```

**Response:**
```json
{
  "session_id": "1",
  "domain": "financial",
  "duration": 3600,
  "total_iterations": 5,
  "agents": [
    {
      "agent_id": "agent_financial_001",
      "agent_name": "Financial Expert",
      "agent_address": "0x123...",
      "usage_count": 3,
      "average_score": 87.67,
      "average_quality": 92.5,
      "contribution_percentage": 45.0
    },
    {
      "agent_id": "agent_investment_001",
      "agent_name": "Investment Advisor",
      "agent_address": "0x456...",
      "usage_count": 2,
      "average_score": 77.5,
      "average_quality": 85.0,
      "contribution_percentage": 35.0
    }
  ]
}
```

### **2. Get Contract Data**
```
GET /session/contract?session_id=1&amount=0.002
```

**Response:**
```json
{
  "session_id": "1",
  "agents": [
    {
      "wallet": "0x123...",
      "amount": "0.000900",
      "agent_id": "agent_financial_001",
      "score": 88
    },
    {
      "wallet": "0x456...",
      "amount": "0.000700",
      "agent_id": "agent_investment_001",
      "score": 78
    },
    {
      "wallet": "0x789...",
      "amount": "0.000400",
      "agent_id": "agent_tax_001",
      "score": 70
    }
  ]
}
```

---

## 💰 Payment Distribution

### **Example: 0.002 ETH Paid**

**Platform Fee (5%):** 0.0001 ETH

**Available for Agents (95%):** 0.0019 ETH

**Distribution:**
- Agent A (45%): 0.000855 ETH
- Agent B (35%): 0.000665 ETH
- Agent C (20%): 0.000380 ETH

**Total:** 0.0019 ETH ✅

---

## 🔧 Integration with Frontend

### **1. Send Session ID with Messages:**

```javascript
// In TeelaChat.jsx
const sendMessage = async (message) => {
  const response = await fetch('http://localhost:8010/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message,
      session_id: session.sessionId,  // ← Add this
      domain: domain.id                // ← Add this
    })
  });
};
```

### **2. Get Summary on Timer Expiry:**

```javascript
// When timer hits 0:00
const handleSessionExpiry = async () => {
  // Get session summary
  const summary = await fetch(
    `http://localhost:8010/session/summary?session_id=${sessionId}`
  ).then(r => r.json());
  
  console.log('Session Summary:', summary);
  
  // Get contract data
  const contractData = await fetch(
    `http://localhost:8010/session/contract?session_id=${sessionId}&amount=${session.amount}`
  ).then(r => r.json());
  
  console.log('Contract Data:', contractData);
  
  // Submit to backend for contract distribution
  await fetch('http://localhost:5000/api/escrow/distribute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contractData)
  });
};
```

---

## 🎯 Contract Submission

### **When Timer Expires:**

1. **Get Contract Data:**
```javascript
GET /session/contract?session_id=1&amount=0.002
```

2. **Submit to Backend:**
```javascript
POST /api/escrow/distribute
{
  "sessionId": "1",
  "agents": [
    {
      "wallet": "0x123...",
      "amount": "0.000900",
      "agent_id": "agent_financial_001",
      "score": 88
    }
  ]
}
```

3. **Backend Calls Contracts:**
- `AgentEscrow.distributePayment()` - Distribute ETH
- `AgentScoring.recordScore()` - Record scores

---

## 📊 Balancing Logic

### **Problem:**
Agent with 3% contribution gets unfairly low payment

### **Solution:**
```python
# Find low performers (< 5%)
low_performers = [a for a in agents if a['contribution'] < 5.0]

# Set minimum (2%)
for agent in low_performers:
    agent['contribution'] = 2.0

# Redistribute excess to high performers
remaining = total_to_redistribute - (len(low_performers) * 2.0)
for agent in high_performers:
    proportion = agent['contribution'] / total_high
    agent['contribution'] += remaining * proportion
```

### **Example:**
**Before:**
- Agent A: 60%
- Agent B: 30%
- Agent C: 7%
- Agent D: 3% ← Too low!

**After:**
- Agent A: 61.5% (+1.5%)
- Agent B: 30.5% (+0.5%)
- Agent C: 6% (-1%)
- Agent D: 2% (minimum)

---

## 🧪 Testing

### **1. Start Teela:**
```bash
cd agents
python teela.py
```

### **2. Send Messages with Session:**
```bash
curl -X POST http://localhost:8010/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I invest?",
    "session_id": "test_session_1",
    "domain": "financial"
  }'
```

### **3. Check Session Summary:**
```bash
curl "http://localhost:8010/session/summary?session_id=test_session_1"
```

### **4. Get Contract Data:**
```bash
curl "http://localhost:8010/session/contract?session_id=test_session_1&amount=0.002"
```

---

## 📝 Files Modified

```
✅ agents/teela.py
   - Added SessionUsageTracker class
   - Integrated session tracking
   - Added API endpoints
   - Updated message handlers
```

---

## ✅ Complete Features

- [x] Session usage tracking
- [x] Cumulative score calculation
- [x] Contribution percentage
- [x] Low performer balancing
- [x] Contract data preparation
- [x] API endpoints
- [x] Session initialization
- [x] Agent scoring (0-100)
- [x] Wallet address tracking
- [x] ETH amount calculation
- [x] Quality metrics
- [x] Fair distribution

---

## 🎉 Summary

**Now when the timer hits 0:00:**

1. ✅ Get session summary with all agent usage
2. ✅ Get contract data with ETH amounts
3. ✅ Submit to escrow contract for distribution
4. ✅ Submit to scoring contract for recording
5. ✅ Agents get paid fairly based on contribution
6. ✅ Scores recorded on-chain

**Each agent's contribution is:**
- ✅ Tracked cumulatively
- ✅ Scored out of 100
- ✅ Balanced fairly
- ✅ Ready for contract submission
