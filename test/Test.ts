import assert from "assert";
import { 
  TestHelpers,
  AgentScoring_BackendUpdated
} from "generated";
const { MockDb, AgentScoring } = TestHelpers;

describe("AgentScoring contract BackendUpdated event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for AgentScoring contract BackendUpdated event
  const event = AgentScoring.BackendUpdated.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("AgentScoring_BackendUpdated is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await AgentScoring.BackendUpdated.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualAgentScoringBackendUpdated = mockDbUpdated.entities.AgentScoring_BackendUpdated.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedAgentScoringBackendUpdated: AgentScoring_BackendUpdated = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      newBackend: event.params.newBackend,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualAgentScoringBackendUpdated, expectedAgentScoringBackendUpdated, "Actual AgentScoringBackendUpdated should be the same as the expectedAgentScoringBackendUpdated");
  });
});
