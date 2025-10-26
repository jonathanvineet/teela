# Migration to Envio Hosted Service

## Overview

This guide migrates your indexer from local Docker setup to Envio's fully managed hosted service. **No Docker required!**

---

## What Changes

### ❌ REMOVED (Docker-based)
- `generated/docker-compose.yaml` - No longer needed
- Local PostgreSQL container
- Local Hasura container
- `npm run envio:dev` - Local development command
- Manual database management

### ✅ ADDED (Hosted Service)
- GitHub-based deployment
- Fully managed infrastructure
- Static production GraphQL endpoint
- Built-in monitoring & alerts
- Zero-downtime deployments

---

## Step-by-Step Migration

### 1. Prerequisites

**Required:**
- GitHub account
- Your code pushed to a GitHub repository
- Envio account (sign up at https://envio.dev)

**Check your current setup:**
```bash
# Verify your config is correct
cat config.yaml

# Verify your schema
cat schema.graphql

# Verify your handlers
cat src/EventHandlers.ts
```

---

### 2. Prepare Your Repository

**A. Ensure all Envio files are in the root:**
```
/Users/vine/elco/teela/
├── config.yaml           ✅ (already there)
├── schema.graphql        ✅ (already there)
├── src/
│   └── EventHandlers.ts  ✅ (already there)
├── .env                  ✅ (already there)
└── package.json          ✅ (already there)
```

**B. Update `.gitignore` to include generated files:**
```bash
# Add to .gitignore if not already there
echo "generated/" >> .gitignore
echo ".envio/" >> .gitignore
```

**C. Commit and push to GitHub:**
```bash
git add .
git commit -m "Prepare for Envio hosted service deployment"
git push origin main
```

---

### 3. Deploy to Envio Hosted Service

#### Step 3.1: Login to Envio
1. Visit https://envio.dev
2. Click "Sign in with GitHub"
3. Authorize the Envio app

#### Step 3.2: Create New Indexer
1. Click "Add Indexer" or "New Indexer"
2. Select your organization (personal or team)

#### Step 3.3: Install GitHub App
1. Click "Install Envio Deployments GitHub App"
2. Choose which repositories to grant access
3. Select your `teela` repository
4. Click "Install"

#### Step 3.4: Configure Deployment
Fill in the deployment settings:

```yaml
Repository: jonathanvineet/teela (or your repo)
Branch: main (or your deployment branch)
Config File: config.yaml
Root Directory: . (leave as root)
```

**Important Settings:**
- **Config File Location**: `config.yaml` (in root)
- **Root Directory**: `.` (current directory)
- **Deployment Branch**: `main` (or create a `deploy` branch)

#### Step 3.5: Set Environment Variables
In the Envio dashboard, add your environment variables:

```bash
# Required for HyperSync
ENVIO_API_TOKEN=7a326696-6cd6-4996-b14b-a371c298b0ac

# Network RPC (for Sepolia)
11155111_RPC_URL=https://sepolia.infura.io/v3/bfebfef38464407e8b4ff77652a3eed7
```

**Note:** The hosted service will automatically set up the database - you don't need to configure PostgreSQL!

#### Step 3.6: Deploy
1. Click "Deploy" or "Create Indexer"
2. Envio will:
   - Clone your repository
   - Run `envio codegen`
   - Build your indexer
   - Start syncing from `start_block: 9493316`
   - Expose a GraphQL endpoint

---

### 4. Get Your GraphQL Endpoint

After deployment completes (2-5 minutes):

1. Go to your indexer dashboard
2. Find the **GraphQL Endpoint URL**
3. It will look like:
   ```
   https://indexer.bigdevenergy.link/YOUR-ID/v1/graphql
   ```

**Copy this URL!** You'll need it for your frontend.

---

### 5. Update Your Frontend

**A. Update `.env`:**
```bash
# OLD (local Docker)
# VITE_ENVIO_URL=http://localhost:8080/v1/graphql

# NEW (hosted service)
VITE_ENVIO_URL=https://indexer.bigdevenergy.link/YOUR-ID/v1/graphql
```

**B. Restart your frontend:**
```bash
# Stop current dev server (Ctrl+C)
npm run dev
```

**C. Verify in browser console:**
```
✅ Loaded scores from Envio: X agents
```

---

### 6. Update package.json Scripts

**Remove Docker-dependent commands:**

```json
{
  "scripts": {
    "dev": "bash scripts/cleanup-ports.sh && concurrently -k -n dev:frontend,dev:backend,dev:lab,dev:save -c green,blue,magenta,cyan \"vite\" \"bash backend/start-backend.sh\" \"python3 agents/lab_simulator.py\" \"node server/saveAgentServer.js\"",
    "dev:backend": "bash backend/start-backend.sh",
    "dev:frontend": "vite",
    "dev:lab": "python3 agents/lab_simulator.py",
    "dev:save": "node server/saveAgentServer.js",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "submit-scores": "node scripts/submitScoresViaEscrow.js",
    "envio:codegen": "envio codegen"
  }
}
```

**Removed:**
- ❌ `envio:dev` - No longer needed (hosted service runs this)
- ❌ `envio:start` - No longer needed
- ❌ `envio:deploy` - Use Git push instead

**Keep:**
- ✅ `envio:codegen` - Still useful for local development/testing

---

### 7. Update Documentation

**Update `ENVIO_INTEGRATION_COMPLETE.md`:**

Replace the "Starting Envio" section with:

```markdown
## Using Envio Hosted Service

### Production Deployment
Your indexer is deployed at:
https://indexer.bigdevenergy.link/YOUR-ID/v1/graphql

### Making Changes
1. Update your code locally
2. Test with `npm run envio:codegen`
3. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update indexer"
   git push origin main
   ```
4. Envio automatically rebuilds and deploys
5. Zero-downtime deployment - your GraphQL endpoint stays available

### Monitoring
- View logs: https://envio.dev/dashboard
- Check sync status: Real-time in dashboard
- Set up alerts: Discord, Slack, Telegram, or Email
```

---

## Testing Your Migration

### 1. Verify Indexer is Syncing
```bash
# Check the Envio dashboard
# Look for:
# ✅ Status: Running
# ✅ Synced: X blocks
# ✅ Latest Block: Should be close to current block
```

### 2. Test GraphQL Endpoint
```bash
curl -X POST https://indexer.bigdevenergy.link/YOUR-ID/v1/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ Agent { agentId totalScore sessionCount averageScore totalRevenue } }"
  }'
```

### 3. Test Frontend
```bash
# Start frontend
npm run dev

# Open http://localhost:5173
# Go to Owner Dashboard
# Check browser console:
# Should see: "✅ Loaded scores from Envio: X agents"
```

### 4. Submit New Scores
```bash
# Submit test scores
npm run submit-scores

# Wait 10-30 seconds
# Refresh dashboard
# Scores should update automatically
```

---

## Advantages of Hosted Service

### vs Local Docker Setup:

| Feature | Docker (Local) | Hosted Service |
|---------|---------------|----------------|
| **Setup** | Install Docker, run containers | Push to GitHub |
| **Database** | Manage PostgreSQL yourself | Fully managed |
| **Uptime** | Only when your computer is on | 24/7 |
| **Scaling** | Manual | Automatic |
| **Monitoring** | Manual log checking | Built-in dashboard |
| **Alerts** | None | Discord/Slack/Email |
| **Deployments** | Manual restart | Git push = deploy |
| **Rollback** | Manual | One-click |
| **Cost** | Local resources | Free tier available |

---

## Continuous Deployment

### How It Works:
```
1. You push code to GitHub
   ↓
2. Envio detects the push
   ↓
3. Envio builds your indexer
   ↓
4. Envio deploys with zero downtime
   ↓
5. Your GraphQL endpoint stays available
   ↓
6. You get a notification (if configured)
```

### Best Practices:
1. **Use a deployment branch**: Create a `deploy` branch for production
2. **Test locally first**: Run `envio codegen` to catch errors
3. **Monitor deployments**: Check the dashboard after pushing
4. **Set up alerts**: Get notified of issues immediately

---

## Monitoring & Alerts

### Built-in Monitoring:
- **Sync Status**: Real-time block progress
- **Error Logs**: See handler errors immediately
- **Performance Metrics**: Query latency, indexing speed
- **Deployment History**: Track all deployments

### Setting Up Alerts:
1. Go to indexer settings
2. Click "Alerts"
3. Add notification channels:
   - Discord webhook
   - Slack webhook
   - Telegram bot
   - Email address
4. Configure alert types:
   - Indexer stopped
   - Handler errors
   - Sync lag warnings
   - Deployment failures

---

## Rollback Plan

If something goes wrong:

### Option 1: Rollback in Dashboard
1. Go to "Deployments" tab
2. Find previous working version
3. Click "Switch to this version"
4. Instant rollback (zero downtime)

### Option 2: Revert Git Commit
```bash
git revert HEAD
git push origin main
# Envio auto-deploys the reverted version
```

---

## Cleanup (Optional)

After confirming hosted service works:

### Remove Docker Files:
```bash
# Remove docker-compose
rm generated/docker-compose.yaml

# Update .gitignore
echo "docker-compose.yaml" >> .gitignore

# Commit
git add .
git commit -m "Remove Docker setup - using hosted service"
git push origin main
```

### Uninstall Docker (if not used elsewhere):
```bash
# macOS: Uninstall Docker Desktop from Applications
# This frees up disk space and resources
```

---

## Troubleshooting

### Issue: Deployment Failed
**Solution:**
1. Check deployment logs in Envio dashboard
2. Common issues:
   - Missing `config.yaml`
   - Invalid schema syntax
   - Handler TypeScript errors
3. Fix locally, test with `envio codegen`, push again

### Issue: Indexer Not Syncing
**Solution:**
1. Check `start_block` in `config.yaml`
2. Verify RPC URL is correct
3. Check if contract address is correct
4. Look for errors in logs

### Issue: Frontend Still Using Fallback
**Solution:**
1. Verify `VITE_ENVIO_URL` in `.env`
2. Restart frontend (Vite needs restart for env changes)
3. Check browser console for CORS errors
4. Verify GraphQL endpoint is accessible

### Issue: No Data in GraphQL
**Solution:**
1. Check if indexer has synced past your events
2. Submit new test scores
3. Wait 10-30 seconds for indexing
4. Query again

---

## Summary

✅ **Migration Complete!**

**What You Gained:**
- No Docker required
- 24/7 uptime
- Automatic deployments via Git
- Built-in monitoring & alerts
- Zero-downtime deployments
- One-click rollbacks
- Fully managed infrastructure

**What You Lost:**
- Nothing! All functionality is the same or better

**New Workflow:**
1. Make changes locally
2. Test with `envio codegen`
3. Push to GitHub
4. Envio auto-deploys
5. Monitor in dashboard

**Your GraphQL endpoint is now production-ready!** 🚀

---

## Next Steps

1. ✅ Set up alerts (Discord/Slack)
2. ✅ Configure IP whitelisting (if needed)
3. ✅ Add team members to your organization
4. ✅ Set up staging environment (separate branch)
5. ✅ Monitor performance metrics

**Need Help?**
- Envio Docs: https://docs.envio.dev
- Discord: https://discord.gg/envio
- Support: support@envio.dev
