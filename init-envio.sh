#!/bin/bash

# This script initializes Envio with our contract
# Simulating the interactive prompts

cat > config.yaml << 'EOF'
name: teela-agent-scoring
description: TEELA Agent Scoring Indexer
networks:
  - id: 11155111  # Sepolia
    start_block: 9493460
    contracts:
      - name: AgentScoring
        address:
          - "0x2364Fe8d139f1A3eA88399d0217c7aCA6D712f19"
        handler: src/EventHandlers.js
        events:
          - event: "ScoreRecorded(string agentId, uint256 score, uint256 revenue)"
          - event: "EscrowUpdated(address newEscrow)"
        abi_file_path: contracts/AgentScoring.abi.json
EOF

echo "✅ Created config.yaml"

# Create schema.graphql
cat > schema.graphql << 'EOF'
type Agent {
  id: ID!
  agentId: String!
  totalScore: BigInt!
  sessionCount: Int!
  averageScore: BigInt!
  totalRevenue: BigInt!
  lastUpdated: BigInt!
}

type AgentScoring_EscrowUpdated {
  id: ID!
  newEscrow: String!
}

type AgentScoring_ScoreRecorded {
  id: ID!
  agentId: String!
  score: BigInt!
  revenue: BigInt!
  timestamp: BigInt!
  blockNumber: BigInt!
}
EOF

echo "✅ Created schema.graphql"

# Create EventHandlers.js
mkdir -p src
cat > src/EventHandlers.js << 'EOF'
const { AgentScoring } = require("generated");

AgentScoring.EscrowUpdated.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    newEscrow: event.params.newEscrow,
  };
  context.AgentScoring_EscrowUpdated.set(entity);
});

AgentScoring.ScoreRecorded.handler(async ({ event, context }) => {
  const agentId = event.params.agentId;
  
  // 1. Store the raw score event
  const scoreEvent = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    agentId: agentId,
    score: event.params.score,
    revenue: event.params.revenue,
    timestamp: event.block.timestamp,
    blockNumber: event.block.number,
  };
  context.AgentScoring_ScoreRecorded.set(scoreEvent);
  
  // 2. Update or create aggregated Agent entity
  let agent = await context.Agent.get(agentId);
  
  if (!agent) {
    agent = {
      id: agentId,
      agentId: agentId,
      totalScore: 0n,
      sessionCount: 0,
      averageScore: 0n,
      totalRevenue: 0n,
      lastUpdated: event.block.timestamp,
    };
  }
  
  // 3. Aggregate the scores
  agent.totalScore = agent.totalScore + event.params.score;
  agent.sessionCount = agent.sessionCount + 1;
  agent.averageScore = agent.totalScore / BigInt(agent.sessionCount);
  agent.totalRevenue = agent.totalRevenue + event.params.revenue;
  agent.lastUpdated = event.block.timestamp;
  
  // 4. Save the updated agent
  context.Agent.set(agent);
});
EOF

echo "✅ Created src/EventHandlers.js"

# Run codegen
echo "🔄 Running envio codegen..."
npx envio codegen

echo "✅ Envio initialization complete!"
echo ""
echo "Next steps:"
echo "1. Commit and push: git add . && git commit -m 'Initialize Envio' && git push"
echo "2. Envio will auto-deploy from the envio branch"
echo "3. Wait for syncing to complete"
EOF
