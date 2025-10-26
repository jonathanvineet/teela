
const assert = require("assert");
const { TestHelpers } = require("generated");
const { MockDb, AgentScoring } = TestHelpers;

describe("AgentScoring contract EscrowUpdated event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for AgentScoring contract EscrowUpdated event
  const event = AgentScoring.EscrowUpdated.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("AgentScoring_EscrowUpdated is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await AgentScoring.EscrowUpdated.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualAgentScoringEscrowUpdated = mockDbUpdated.entities.AgentScoring_EscrowUpdated.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedAgentScoringEscrowUpdated = {
      id:`${event.chainId}_${event.block.number}_${event.logIndex}`,
      newEscrow: event.params.newEscrow,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(
      actualAgentScoringEscrowUpdated,
      expectedAgentScoringEscrowUpdated,
      "Actual AgentScoringEscrowUpdated should be the same as the expectedAgentScoringEscrowUpdated"
    );
  });
});
