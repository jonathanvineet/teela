# Envio Hosted Service Deployment Checklist

## Pre-Deployment Checklist

### ✅ Code Ready
- [ ] `config.yaml` is in repository root
- [ ] `schema.graphql` is in repository root
- [ ] `src/EventHandlers.ts` exists and compiles
- [ ] Run `npm run envio:codegen` without errors
- [ ] Contract address is correct in `config.yaml`
- [ ] Start block is correct (9493316 for your setup)
- [ ] RPC URL is valid and accessible

### ✅ GitHub Ready
- [ ] Code is pushed to GitHub
- [ ] Repository is accessible (public or private with access)
- [ ] You have admin access to the repository
- [ ] Main branch (or deployment branch) is up to date

### ✅ Environment Variables Ready
- [ ] `ENVIO_API_TOKEN` available
- [ ] `11155111_RPC_URL` (Sepolia RPC) available
- [ ] RPC endpoint has sufficient rate limits

---

## Deployment Steps

### Step 1: Access Envio Platform
- [ ] Go to https://envio.dev
- [ ] Sign in with GitHub
- [ ] Verify you're in the correct organization

### Step 2: Install GitHub App
- [ ] Click "Add Indexer"
- [ ] Click "Install Envio Deployments GitHub App"
- [ ] Select your repository (`teela`)
- [ ] Grant necessary permissions
- [ ] Confirm installation

### Step 3: Configure Indexer
- [ ] Repository: `your-username/teela`
- [ ] Branch: `main` (or your deployment branch)
- [ ] Config File: `config.yaml`
- [ ] Root Directory: `.` (current directory)
- [ ] Indexer Name: `teela-agent-scoring` (or custom name)

### Step 4: Set Environment Variables
In Envio dashboard, add:
- [ ] `ENVIO_API_TOKEN` = `7a326696-6cd6-4996-b14b-a371c298b0ac`
- [ ] `11155111_RPC_URL` = `https://sepolia.infura.io/v3/bfebfef38464407e8b4ff77652a3eed7`

### Step 5: Deploy
- [ ] Click "Deploy" or "Create Indexer"
- [ ] Wait for build to complete (2-5 minutes)
- [ ] Check for any build errors
- [ ] Verify deployment status shows "Running"

### Step 6: Get GraphQL Endpoint
- [ ] Copy GraphQL endpoint URL from dashboard
- [ ] Format: `https://indexer.bigdevenergy.link/YOUR-ID/v1/graphql`
- [ ] Save this URL (you'll need it for frontend)

---

## Post-Deployment Verification

### Step 7: Test GraphQL Endpoint
```bash
# Test with curl
curl -X POST https://indexer.bigdevenergy.link/YOUR-ID/v1/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ Agent { agentId totalScore } }"}'
```

- [ ] GraphQL endpoint is accessible
- [ ] Query returns valid JSON
- [ ] No authentication errors

### Step 8: Check Sync Status
In Envio dashboard:
- [ ] Indexer status shows "Running"
- [ ] Sync progress is advancing
- [ ] Current block is close to latest block
- [ ] No error messages in logs

### Step 9: Update Frontend
- [ ] Update `.env` file:
  ```bash
  VITE_ENVIO_URL=https://indexer.bigdevenergy.link/YOUR-ID/v1/graphql
  ```
- [ ] Restart frontend: `npm run dev`
- [ ] Clear browser cache (Ctrl+Shift+R)

### Step 10: Test Frontend Integration
- [ ] Open http://localhost:5173
- [ ] Navigate to Owner Dashboard
- [ ] Open browser console (F12)
- [ ] Look for: `"✅ Loaded scores from Envio: X agents"`
- [ ] Verify agent data displays correctly
- [ ] No CORS errors in console
- [ ] No GraphQL errors in console

---

## Data Verification

### Step 11: Submit Test Scores
```bash
npm run submit-scores
```

- [ ] Transaction succeeds on Sepolia
- [ ] Wait 10-30 seconds for indexing
- [ ] Check Envio logs for event processing
- [ ] Refresh dashboard to see new scores

### Step 12: Query Historical Data
```bash
# Query all agents
curl -X POST https://indexer.bigdevenergy.link/YOUR-ID/v1/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ Agent { agentId totalScore sessionCount averageScore totalRevenue } }"
  }'
```

- [ ] All agents are present
- [ ] Scores match expected values
- [ ] Session counts are correct
- [ ] Revenue totals are accurate

### Step 13: Test Real-time Updates
- [ ] Submit new scores via contract
- [ ] Wait 10-30 seconds
- [ ] Refresh dashboard
- [ ] Verify new scores appear
- [ ] Check that aggregations updated correctly

---

## Monitoring Setup

### Step 14: Configure Alerts
- [ ] Go to indexer settings in dashboard
- [ ] Click "Alerts" tab
- [ ] Add Discord webhook (if using)
- [ ] Add Slack webhook (if using)
- [ ] Add Telegram bot (if using)
- [ ] Add email address (if using)
- [ ] Test alert notifications

### Step 15: Alert Types
Enable alerts for:
- [ ] Indexer stopped/crashed
- [ ] Handler errors
- [ ] Sync lag warnings
- [ ] Deployment failures
- [ ] Deployment successes

---

## Security & Access

### Step 16: IP Whitelisting (Optional)
If you need to restrict access:
- [ ] Go to indexer settings
- [ ] Click "Security" tab
- [ ] Add allowed IP addresses or domains
- [ ] Test access from allowed IPs
- [ ] Verify blocked IPs cannot access

### Step 17: Team Access
- [ ] Add team members to Envio organization
- [ ] Set appropriate permissions
- [ ] Share GraphQL endpoint URL
- [ ] Document access procedures

---

## Documentation Updates

### Step 18: Update Project Documentation
- [ ] Update README.md with new GraphQL URL
- [ ] Update deployment instructions
- [ ] Document environment variables
- [ ] Add troubleshooting section
- [ ] Update team onboarding docs

### Step 19: Update .env.example
- [ ] Set hosted service URL as default
- [ ] Add comments explaining each variable
- [ ] Remove Docker-specific variables
- [ ] Commit and push changes

---

## Cleanup (Optional)

### Step 20: Remove Docker Setup
If you're confident the hosted service works:
- [ ] Remove `generated/docker-compose.yaml`
- [ ] Update `.gitignore` to exclude Docker files
- [ ] Remove Docker-related scripts from `package.json`
- [ ] Uninstall Docker Desktop (if not needed elsewhere)
- [ ] Update documentation to remove Docker references

---

## Continuous Deployment Setup

### Step 21: Configure Auto-Deploy
- [ ] Verify deployment branch is set correctly
- [ ] Test auto-deploy by pushing a small change
- [ ] Verify Envio detects the push
- [ ] Check that build starts automatically
- [ ] Confirm deployment completes successfully
- [ ] Test zero-downtime deployment

### Step 22: Set Up Staging (Optional)
For production safety:
- [ ] Create `staging` branch
- [ ] Deploy separate staging indexer
- [ ] Test changes on staging first
- [ ] Merge to `main` for production deploy

---

## Performance Verification

### Step 23: Check Performance Metrics
In Envio dashboard:
- [ ] Indexing speed (blocks/second)
- [ ] Query latency (milliseconds)
- [ ] Memory usage
- [ ] Database size
- [ ] No performance warnings

### Step 24: Load Testing
- [ ] Submit multiple scores rapidly
- [ ] Query GraphQL endpoint repeatedly
- [ ] Check for rate limiting
- [ ] Verify data consistency
- [ ] Monitor for errors

---

## Rollback Plan

### Step 25: Test Rollback Procedure
- [ ] Note current deployment version
- [ ] Deploy a test change
- [ ] Use dashboard to rollback to previous version
- [ ] Verify rollback completes successfully
- [ ] Test that old version works correctly

---

## Final Verification

### Step 26: End-to-End Test
Complete workflow:
1. [ ] User connects wallet
2. [ ] User rents agent
3. [ ] Session completes
4. [ ] Scores submitted to contract
5. [ ] Envio indexes the event
6. [ ] Dashboard displays updated scores
7. [ ] All aggregations are correct

### Step 27: Production Readiness
- [ ] All tests passing
- [ ] No errors in logs
- [ ] Monitoring configured
- [ ] Alerts working
- [ ] Team has access
- [ ] Documentation updated
- [ ] Rollback plan tested

---

## Sign-Off

### Deployment Complete ✅

**Deployed By:** _________________
**Date:** _________________
**GraphQL Endpoint:** _________________
**Deployment ID:** _________________

**Verified By:** _________________
**Date:** _________________

---

## Troubleshooting Reference

### Common Issues

**Issue: Build Failed**
- Check `config.yaml` syntax
- Run `npm run envio:codegen` locally
- Check TypeScript errors in handlers
- Verify all imports are correct

**Issue: Indexer Not Syncing**
- Check RPC URL is correct
- Verify start_block is valid
- Check contract address is correct
- Look for errors in logs

**Issue: No Data in GraphQL**
- Verify indexer has synced past your events
- Check that events were emitted on-chain
- Submit new test scores
- Wait 10-30 seconds for indexing

**Issue: Frontend Can't Connect**
- Verify `VITE_ENVIO_URL` in `.env`
- Restart frontend (Vite needs restart)
- Check for CORS errors
- Verify endpoint is accessible

**Issue: Slow Queries**
- Check database indices in schema
- Optimize GraphQL queries
- Consider pagination for large datasets
- Contact Envio support for performance tuning

---

## Support Contacts

**Envio Support:**
- Discord: https://discord.gg/envio
- Email: support@envio.dev
- Docs: https://docs.envio.dev

**Internal Team:**
- DevOps Lead: _________________
- Backend Lead: _________________
- Frontend Lead: _________________

---

## Next Steps After Deployment

1. [ ] Monitor for 24 hours
2. [ ] Set up weekly performance reviews
3. [ ] Plan for scaling if needed
4. [ ] Document any custom configurations
5. [ ] Train team on monitoring tools
6. [ ] Schedule regular maintenance windows
7. [ ] Plan for future upgrades

---

**Deployment Status: [ ] Complete**

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
