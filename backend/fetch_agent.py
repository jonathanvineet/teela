"""Simple uAgents Fetch.ai agent example

This agent will register itself and respond to messages with performative 'request'
containing 'hello' with a simple reply.

Docs: https://uagents.fetch.ai/docs/quickstart
"""
import os
from dotenv import load_dotenv

from uagents import Agent
from uagents_core.models import Model

load_dotenv()

AGENT_NAME = os.getenv('FETCH_AGENT_NAME', 'teela-agent')


class HelloMessage(Model):
    content: str


def main():
    agent = Agent(name=AGENT_NAME)

    @agent.on_message(HelloMessage)
    async def handle_hello(ctx, sender, message: HelloMessage):
        print(f"Received hello from {sender}: {message.content}")

    print(f"Starting agent {AGENT_NAME}...")
    # agent.run() is blocking and will manage its own loop
    agent.run()


if __name__ == '__main__':
    main()
