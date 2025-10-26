## Envio Indexer

*Please refer to the [documentation website](https://docs.envio.dev) for a thorough guide on all [Envio](https://envio.dev) indexer features*

### 🚀 Quick Deploy (Recommended)

**Deploy to Envio Hosted Service (No Docker required!)**

See [`QUICK_DEPLOY_HOSTED.md`](./QUICK_DEPLOY_HOSTED.md) for 5-minute setup guide.

```bash
# 1. Push to GitHub
git push origin main

# 2. Deploy at https://envio.dev
# 3. Get your GraphQL endpoint
# 4. Update .env with endpoint URL
# 5. Done! 24/7 uptime, auto-deployments, built-in monitoring
```

### 📊 GraphQL Endpoint

**Production (Hosted Service):**
```
https://indexer.bigdevenergy.link/YOUR-ID/v1/graphql
```

### 🛠️ Local Development

**Generate types from config:**
```bash
npm run envio:codegen
```

### Pre-requisites

- [Node.js (use v18 or newer)](https://nodejs.org/en/download/current)
- [npm or pnpm](https://nodejs.org/en/download/current)
- GitHub account (for hosted deployment)
