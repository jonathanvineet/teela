import {
  AgentScoring,
  AgentScoring_EscrowUpdated,
  AgentScoring_ScoreRecorded,
} from "generated";

AgentScoring.EscrowUpdated.handler(async ({ event, context }) => {
  const entity: AgentScoring_EscrowUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    newEscrow: event.params.newEscrow,
  };

  context.AgentScoring_EscrowUpdated.set(entity);
});

AgentScoring.ScoreRecorded.handler(async ({ event, context }) => {
  const entity: AgentScoring_ScoreRecorded = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    agentId: event.params.agentId,
    score: event.params.score,
    revenue: event.params.revenue,
  };

  context.AgentScoring_ScoreRecorded.set(entity);
});
