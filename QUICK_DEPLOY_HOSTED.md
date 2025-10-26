# Quick Deploy to Envio Hosted Service

## 🚀 5-Minute Setup

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Deploy to Envio hosted service"
git push origin main
```

### Step 2: Deploy on Envio
1. Go to https://envio.dev
2. Sign in with GitHub
3. Click "Add Indexer"
4. Install GitHub App → Select your repo
5. Configure:
   - **Repository**: `your-username/teela`
   - **Branch**: `main`
   - **Config File**: `config.yaml`
   - **Root Directory**: `.`

### Step 3: Add Environment Variables
In Envio dashboard, add:
```bash
ENVIO_API_TOKEN=7a326696-6cd6-4996-b14b-a371c298b0ac
11155111_RPC_URL=https://sepolia.infura.io/v3/bfebfef38464407e8b4ff77652a3eed7
```

### Step 4: Deploy & Get Endpoint
1. Click "Deploy"
2. Wait 2-5 minutes
3. Copy your GraphQL endpoint:
   ```
   https://indexer.bigdevenergy.link/YOUR-ID/v1/graphql
   ```

### Step 5: Update Frontend
```bash
# Update .env
VITE_ENVIO_URL=https://indexer.bigdevenergy.link/YOUR-ID/v1/graphql

# Restart frontend
npm run dev
```

### Step 6: Test
```bash
# Submit test scores
npm run submit-scores

# Check browser console
# Should see: "✅ Loaded scores from Envio"
```

---

## ✅ Done!

**No Docker needed!**
- Your indexer runs 24/7
- Auto-deploys on git push
- Built-in monitoring
- Zero-downtime updates

---

## 📊 Monitor Your Indexer

**Dashboard**: https://envio.dev/dashboard
- View sync status
- Check logs
- Monitor performance
- Manage deployments

---

## 🔄 Make Updates

```bash
# 1. Edit your code
vim src/EventHandlers.ts

# 2. Test locally
npm run envio:codegen

# 3. Deploy
git add .
git commit -m "Update handlers"
git push origin main

# 4. Envio auto-deploys (2-3 minutes)
```

---

## 🆘 Troubleshooting

### Deployment Failed?
- Check logs in Envio dashboard
- Run `npm run envio:codegen` locally to catch errors

### No Data?
- Verify `start_block` in `config.yaml`
- Check contract address is correct
- Submit new test scores

### Frontend Not Working?
- Verify `VITE_ENVIO_URL` in `.env`
- Restart frontend (Ctrl+C, then `npm run dev`)
- Check browser console for errors

---

## 📚 Full Guide

See `HOSTED_SERVICE_MIGRATION.md` for complete documentation.
