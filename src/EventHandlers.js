/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
const {
 AgentScoring,
} = require("generated");

AgentScoring.EscrowUpdated.handler(async ({event, context}) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    newEscrow: event.params.newEscrow,
  };

  context.AgentScoring_EscrowUpdated.set(entity);
});


AgentScoring.ScoreRecorded.handler(async ({event, context}) => {
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
    // Create new agent entry
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

