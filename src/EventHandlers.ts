/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  AgentScoring,
  AgentScoring_BackendUpdated,
  AgentScoring_EscrowUpdated,
  AgentScoring_ScoreRecorded,
  Agent,
} from "generated";

AgentScoring.BackendUpdated.handler(async ({ event, context }) => {
  const entity: AgentScoring_BackendUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    newBackend: event.params.newBackend,
  };

  context.AgentScoring_BackendUpdated.set(entity);
});

AgentScoring.EscrowUpdated.handler(async ({ event, context }) => {
  const entity: AgentScoring_EscrowUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    newEscrow: event.params.newEscrow,
  };

  context.AgentScoring_EscrowUpdated.set(entity);
});

AgentScoring.ScoreRecorded.handler(async ({ event, context }) => {
  // Store raw event
  const entity: AgentScoring_ScoreRecorded = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    agentId: event.params.agentId,
    score: event.params.score,
    revenue: event.params.revenue,
  };
  context.AgentScoring_ScoreRecorded.set(entity);

  // Get or create Agent entity for aggregation
  const agentId = event.params.agentId;
  let agent = await context.Agent.get(agentId);

  if (!agent) {
    // Create new agent
    agent = {
      id: agentId,
      agentId: agentId,
      totalScore: 0n,
      sessionCount: 0,
      averageScore: 0n,
      totalRevenue: 0n,
      lastUpdated: BigInt(event.block.timestamp),
    };
  }

  // Aggregate scores
  agent.totalScore = agent.totalScore + event.params.score;
  agent.sessionCount = agent.sessionCount + 1;
  agent.averageScore = agent.totalScore / BigInt(agent.sessionCount);
  agent.totalRevenue = agent.totalRevenue + event.params.revenue;
  agent.lastUpdated = BigInt(event.block.timestamp);

  // Save aggregated data
  context.Agent.set(agent);
});
