from uagents import Agent, Context

# Define the agent
agent = Agent(name="TeelaAgent", seed="random_seed", endpoint="http://127.0.0.1:8000")

@agent.on_event("startup")
def on_startup(ctx: Context):
    print(f"Agent Name: {agent.name}")
    print(f"Agent Address: {agent.address}")

@agent.on_message
def on_message(sender, message):
    print(f"Received message from {sender}: {message}")
    return f"Hello, {sender}! Your message was: {message}"

if __name__ == "__main__":
    agent.run()