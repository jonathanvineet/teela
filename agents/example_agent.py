"""
Example uAgent for TEELA (keeps local demo handler).
Requires the `uagents` package from pypi and the backend venv.
"""
from uagents import Agent
from uagents_core.models import Model

class Ping(Model):
    message: str

agent = Agent()

@agent.on_message(Ping)
def on_ping(msg: Ping):
    print('Received ping:', msg.message)

if __name__ == '__main__':
    agent.run()
