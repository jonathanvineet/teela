import os
import time
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field
from uagents import Agent, Context, Model

# Configuration via environment (useful for Vercel/containers/tests)
AGENT_NAME = os.environ.get("AGENT_NAME", "teela_agent")
AGENT_SEED = os.environ.get("AGENT_SEED", "teela dev seed phrase")
AGENT_PORT = int(os.environ.get("AGENT_PORT", "8002"))
AGENT_ENDPOINT = [f"http://127.0.0.1:{AGENT_PORT}/submit"]


class CommandRequest(Model):
    command: str
    args: Optional[Dict[str, Any]] = None


class CommandResponse(Model):
    ok: bool
    result: Optional[Dict[str, Any]] = None
    reasoning: Optional[str] = None


# Create the uAgent
agent = Agent(
    name=AGENT_NAME,
    seed=AGENT_SEED,
    port=AGENT_PORT,
    endpoint=AGENT_ENDPOINT,
)


def register_agent() -> str:
    """Helper to return the agent address and indicate registration.

    The uAgents framework registers agents on startup automatically. This
    helper provides a single place you can call from other scripts/tests
    to get the agent address and confirm the agent identity.
    """
    # Agent registration is handled by the framework on agent.run().
    # We return the agent.address so other services/clients can use it.
    return agent.address


@agent.on_event("startup")
async def on_startup(ctx: Context):
    ctx.logger.info(f"Starting agent '{agent.name}' on port {AGENT_PORT}")
    ctx.logger.info(f"Agent address: {agent.address}")


def _simple_reasoning(command: str, args: Optional[Dict[str, Any]] = None) -> str:
    """Produce a short, human-readable reasoning string for a command.

    This is intentionally simple: it shows the shape of a reasoning output
    and can be replaced with LLM-backed reasoning later.
    """
    args_str = f" with args={args}" if args else ""
    return f"I parsed the command '{command}'{args_str}. Based on simple rules I decide to accept and proceed."


@agent.on_rest_post("/command", CommandRequest, CommandResponse)
async def handle_rest_command(ctx: Context, req: CommandRequest) -> CommandResponse:
    """Handle incoming user commands via HTTP POST to /command.

    Example commands:
      - help
      - status
      - reason (expects args.message)
    """
    ctx.logger.info(f"Received REST command: {req.command} (args={req.args})")

    cmd = req.command.strip().lower()

    if cmd == "help":
        return CommandResponse(
            ok=True,
            result={"commands": ["help", "status", "reason <text>"]},
            reasoning=_simple_reasoning("help", req.args),
        )

    if cmd == "status":
        uptime = int(time.time())
        return CommandResponse(
            ok=True,
            result={"status": "running", "time": uptime, "address": agent.address},
            reasoning=_simple_reasoning("status", req.args),
        )

    if cmd.startswith("reason"):
        # accept either `reason` with args.message or `reason <message>`
        message = None
        if req.args and isinstance(req.args, dict):
            message = req.args.get("message")
        if not message:
            parts = req.command.split(" ", 1)
            if len(parts) > 1:
                message = parts[1]

        reason_text = _simple_reasoning("reason", {"message": message})
        return CommandResponse(ok=True, result={"message": message}, reasoning=reason_text)

    return CommandResponse(ok=False, result={"error": "unknown command"}, reasoning=_simple_reasoning(req.command, req.args))


@agent.on_message(model=CommandRequest, replies=CommandResponse)
async def handle_message(ctx: Context, sender: str, msg: CommandRequest):
    """Handle uAgent-to-uAgent messages carrying CommandRequest models."""
    ctx.logger.info(f"Received message from {sender}: {msg.command} (args={msg.args})")

    # Reuse REST handler logic for parity
    response = await handle_rest_command(ctx, msg)
    await ctx.send(sender, response)


if __name__ == "__main__":
    # Expose helper instruction when run directly.
    print("Starting TEELA agent (agent.py). Use /command POST or send uAgent CommandRequest messages.")
    agent.run()
