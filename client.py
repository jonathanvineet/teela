import os
import asyncio
from pydantic import BaseModel
from uagents import Agent, Context, Model

AGENT_NAME = os.environ.get("CLIENT_NAME", "teela_client")
AGENT_PORT = int(os.environ.get("CLIENT_PORT", "8003"))
AGENT_ENDPOINT = [f"http://127.0.0.1:{AGENT_PORT}/submit"]


class CommandRequest(Model):
    command: str
    args: dict | None = None


class CommandResponse(Model):
    ok: bool
    result: dict | None = None
    reasoning: str | None = None


agent = Agent(name=AGENT_NAME, seed="client seed", port=AGENT_PORT, endpoint=AGENT_ENDPOINT)


@agent.on_event("startup")
async def startup(ctx: Context):
    # Wait briefly to allow the other agent to register and start
    await asyncio.sleep(1.0)
    # Look up the environment variable TARGET_AGENT_ADDR, otherwise expect manual edit
    target = os.environ.get("TARGET_AGENT_ADDR")
    if not target:
        ctx.logger.info("No TARGET_AGENT_ADDR set. Please set it to the agent address to message.")
        return

    ctx.logger.info(f"Sending test 'status' command to {target}")
    await ctx.send(target, CommandRequest(command="status", args=None))


@agent.on_message(model=CommandResponse)
async def handle_response(ctx: Context, sender: str, data: CommandResponse):
    ctx.logger.info(f"Got response from {sender}: ok={data.ok}, result={data.result}, reasoning={data.reasoning}")


if __name__ == "__main__":
    print("Starting TEELA client (client.py). Set TARGET_AGENT_ADDR to message the agent.")
    agent.run()
