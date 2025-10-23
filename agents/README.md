# TEELA Agents (Phase 1)

This folder contains a minimal uAgents-based agent (`agent.py`) and a small test client (`client.py`).

Requirements

- Python 3.10+ (3.12 available in the dev container)
- Install dependencies:

```bash
python3 -m pip install -r agents/requirements.txt
```

Run the agent

```bash
python3 agent.py
```

The agent exposes:
- REST POST /command — accepts a JSON body matching CommandRequest and returns CommandResponse

Example POST (using curl):

```bash
curl -X POST http://127.0.0.1:8002/command -H "Content-Type: application/json" -d '{"command":"status"}'
```

Run the client (in a separate terminal)

Set the target agent address (observed in agent logs) before running the client:

```bash
export TARGET_AGENT_ADDR=agent1...address...
python3 client.py
```

Notes

- The `register_agent()` helper in `agent.py` returns the agent address once the uAgents framework has started. Registration with the Almanac/Almanac contract is handled automatically by the uAgents runtime on startup.
- This is a minimal skeleton. We can add ASI:One adapters and a simple LLM reasoning pipeline next.
