# 🔧 Clear Old Session

## The Problem

Your session was created BEFORE we added the `startTime` field, so it's missing that data:

```javascript
// Your current session (MISSING startTime):
{
  sessionId: '1',
  domain: 'financial',
  amount: '0.002',
  txHash: '0xff6f...'
  // ❌ NO startTime!
}

// Should be:
{
  sessionId: '1',
  domain: 'financial',
  amount: '0.002',
  txHash: '0xff6f...',
  startTime: 1730000000000  // ✅ NEEDED!
}
```

## Quick Fix

### Option 1: Clear in Browser Console
Open console (F12) and run:
```javascript
sessionStorage.clear();
location.reload();
```

### Option 2: Clear Manually
1. Open DevTools (F12)
2. Go to "Application" tab
3. Click "Session Storage" → "http://localhost:5173"
4. Right-click → "Clear"
5. Refresh page

## Then Pay Again

1. Click "Start Chat" on Financial Advice
2. Pay with MetaMask
3. **This time you'll see in console:**
```javascript
Payment success, session data: {
  sessionId: "2",
  domain: "financial",
  amount: "0.002",
  txHash: "0x...",
  startTime: 1730000000000  // ✅ NOW IT'S THERE!
}
```

4. ⏰ **Timer will appear:** `60:00`
5. Close chat and click again
6. ✅ **No payment needed!**

## Why This Happened

The `startTime` field was added AFTER you made your first payment, so your old session doesn't have it. Once you clear and pay again, it will work perfectly!
