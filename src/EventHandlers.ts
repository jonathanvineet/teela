import { AgentScoring } from "generated";

AgentScoring.EscrowUpdated.handler(async ({ event, context }) => {
  context.log.info(`Processing EscrowUpdated event`);
  context.AgentScoring_EscrowUpdated.set({
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    newEscrow: event.params.newEscrow,
  });
});

AgentScoring.ScoreRecorded.handler(async ({ event, context }) => {
  context.log.info(`Processing ScoreRecorded for agent: ${event.params.agentId}`);
  context.AgentScoring_ScoreRecorded.set({
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    agentId: event.params.agentId,
    score: event.params.score,
    revenue: event.params.revenue,
  });
});
