# TEELA Quick Start

This file outlines quick setup steps.

1. Clone the repo
2. Copy `.env.example` to `.env` and fill keys
3. Frontend
   - cd frontend
   - npm install
   - npm run dev
4. Contracts
   - cd contracts
   - npm install
   - npx hardhat test
5. Agents
   - cd agents
   - python -m venv .venv
   - source .venv/bin/activate
   - pip install -r requirements.txt
   - python fetch_agent.py

*** End Patch