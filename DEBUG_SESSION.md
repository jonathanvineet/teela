# 🔍 Debug Session & Timer

## Check Console Logs

Open browser console (F12) and look for these logs:

### On Page Load:
```
Restored session from storage: { sessionId, domain, amount, txHash, startTime }
```

### When Clicking Domain:
```
Domain selected: finance
Active session: { ... }
Session found for domain, time left (ms): 3540000
✅ Session valid! Going to chat without payment
```

OR

```
Domain selected: finance
Active session: null
❌ No valid session found
Showing payment modal
```

### After Payment:
```
Payment success, session data: { sessionId, domain, amount, txHash, startTime }
```

---

## Manual Check in Console

Open browser console and run:

```javascript
// Check what's in sessionStorage
console.log('Session:', sessionStorage.getItem('teela_session'));
console.log('Domain:', sessionStorage.getItem('teela_domain'));

// Parse and check
const session = JSON.parse(sessionStorage.getItem('teela_session'));
console.log('Session object:', session);
console.log('Has startTime?', !!session?.startTime);
console.log('Has domain?', !!session?.domain);

// Check time left
if (session?.startTime) {
  const now = Date.now();
  const end = session.startTime + (60 * 60 * 1000);
  const left = end - now;
  console.log('Time left (ms):', left);
  console.log('Time left (min):', Math.floor(left / 60000));
}
```

---

## Expected Session Structure

```javascript
{
  "sessionId": "0",
  "domain": "finance",  // ← Must match domain.id
  "amount": "0.002",
  "txHash": "0x...",
  "startTime": 1730000000000  // ← Must be present
}
```

---

## Common Issues

### Issue 1: Timer Not Showing
**Check:**
- Is `activeSession` not null?
- Does `activeSession.startTime` exist?
- Is Layout receiving the session prop?

**Debug:**
```javascript
// In console
console.log('Active session:', window.sessionStorage.getItem('teela_session'));
```

### Issue 2: Payment Required Again
**Check:**
- Does session.domain match the domain you're clicking?
- Is startTime present and valid?
- Is session expired?

**Debug:**
```javascript
const session = JSON.parse(sessionStorage.getItem('teela_session'));
console.log('Session domain:', session?.domain);
console.log('Clicking domain:', 'finance'); // Replace with actual
console.log('Match?', session?.domain === 'finance');
```

---

## Quick Fix Steps

### 1. Clear Everything and Start Fresh
```javascript
// Run in console
sessionStorage.clear();
location.reload();
```

### 2. Pay Again
- Click "Start Chat" on Financial Advice
- Pay with MetaMask
- Watch console for logs

### 3. Check Session Saved
```javascript
// Run in console after payment
const session = JSON.parse(sessionStorage.getItem('teela_session'));
console.log('Session saved:', session);
console.log('Has all fields?', {
  sessionId: !!session?.sessionId,
  domain: !!session?.domain,
  amount: !!session?.amount,
  txHash: !!session?.txHash,
  startTime: !!session?.startTime
});
```

### 4. Try Clicking Again
- Close chat
- Click "Start Chat" again
- Should NOT ask for payment
- Timer should appear

---

## What Should Happen

### First Payment:
1. Click "Start Chat" → Payment modal
2. Pay → Transaction confirms
3. Console: "Payment success, session data: {...}"
4. Session saved to sessionStorage
5. ⏰ Timer appears showing 60:00
6. Chat opens

### Second Click (within 1 hour):
1. Click "Start Chat" on same domain
2. Console: "✅ Session valid! Going to chat without payment"
3. NO payment modal
4. ⏰ Timer shows remaining time
5. Chat opens immediately

---

## If Still Not Working

### Check These:
1. **Browser console** - Any errors?
2. **Network tab** - Payment transaction successful?
3. **Application tab** → Session Storage - Is `teela_session` there?
4. **Console logs** - What do they say?

### Report These:
- Console logs from payment
- Console logs from clicking domain again
- Session Storage contents
- Any error messages
