# TEELA Frontend

This is a minimal Vite + React scaffold for TEELA.

How to run locally

```bash
cd frontend
npm install
npm run dev
```

Deploy to Vercel

1. Push this repository to GitHub (if you haven't already).
2. Sign in to Vercel (https://vercel.com) and choose "New Project" → "Import Git Repository".
3. Select this repository and the `frontend` directory as the root (if prompted).
4. Set the build command to `npm run build` and the output directory to `dist` (Vite default).
5. Click Deploy.

Alternatively, you can use the Vercel CLI locally:

```bash
npm i -g vercel
cd frontend
vercel login
vercel --prod
```

Notes
- If you want Next.js instead of Vite+React, tell me and I can scaffold a Next app configured for Vercel.
- I can also add Web3 wallet libraries (wagmi, rainbowkit, web3modal) if you want immediate wallet support.
