from datetime import datetime
from uuid import uuid4
from uagents import Agent, Protocol, Context
import asyncio

from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    TextContent,
    chat_protocol_spec,
)

# Initialize client agent
client = Agent(
    name="financial_client",
    seed="financial-client-unique-seed-999",
    port=8132,
    endpoint=["http://127.0.0.1:8132/submit"]
)

# Target agent address on Agentverse
AGENT2_ADDRESS = "agent1qgv43hgx4qvppqlpuq6ld5h5pesgs0jkd6na774jp245f2swcc9jk6nywzn"

# Initialize the chat protocol
chat_proto = Protocol(spec=chat_protocol_spec)

message_queue = []
waiting_for_response = False

# Startup Handler
@client.on_event("startup")
async def startup_handler(ctx: Context):
    ctx.logger.info(f"✅ Client Agent Started")
    ctx.logger.info(f"📍 My Address: {ctx.agent.address}")
    ctx.logger.info(f"🎯 Target: {AGENT2_ADDRESS}")

# Send messages from queue
@client.on_interval(period=6.0)
async def send_message_interval(ctx: Context):
    global message_queue, waiting_for_response
    
    if message_queue and not waiting_for_response:
        text = message_queue.pop(0)
        
        ctx.logger.info(f"🔵 Sending: {text}")
        
        # Create and send ChatMessage
        chat_msg = ChatMessage(
            timestamp=datetime.utcnow(),
            msg_id=uuid4(),
            content=[TextContent(type="text", text=text)]
        )
        
        await ctx.send(AGENT2_ADDRESS, chat_msg)
        ctx.logger.info(f"🟢 Message sent, waiting for response...")
        waiting_for_response = True

# Handle incoming messages
@chat_proto.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    global waiting_for_response
    
    for item in msg.content:
        if isinstance(item, TextContent):
            ctx.logger.info(f"🟢 RECEIVED: {item.text}")
            print(f"\n{'='*70}")
            print(f"🤖 Financial Advisor:")
            print(f"\n{item.text}\n")
            print(f"{'='*70}\n")
            
            # Send acknowledgment
            ack = ChatAcknowledgement(
                timestamp=datetime.utcnow(),
                acknowledged_msg_id=msg.msg_id
            )
            await ctx.send(sender, ack)
            
            waiting_for_response = False
            print("You: ", end="", flush=True)

# Handle acknowledgements
@chat_proto.on_message(ChatAcknowledgement)
async def handle_acknowledgement(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.info(f"✅ Acknowledgement from {sender}")

client.include(chat_proto, publish_manifest=True)

# Input loop
async def chat_input_loop():
    await asyncio.sleep(10)
    
    print("\n" + "="*70)
    print("✅ Financial Chat Client Ready!")
    print("="*70)
    print("\n💡 Ask me about:")
    print("  - Debt management")
    print("  - Investment strategies") 
    print("  - Budget planning")
    print("  - Retirement planning")
    print("\nType 'quit' to exit\n")
    print("="*70 + "\n")
    
    loop = asyncio.get_event_loop()
    
    while True:
        try:
            user_input = await loop.run_in_executor(None, input, "You: ")
            
            if user_input.lower() in ['quit', 'exit']:
                print("\n👋 Goodbye!")
                break
            
            if user_input.strip():
                message_queue.append(user_input)
            else:
                print("⚠️ Please enter a message.")
                
        except (EOFError, KeyboardInterrupt):
            print("\n\n👋 Chat ended")
            break

async def run_client():
    try:
        agent_task = asyncio.create_task(client.run_async())
        input_task = asyncio.create_task(chat_input_loop())
        await asyncio.gather(agent_task, input_task, return_exceptions=True)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("\n🚀 Starting Financial Chat Client...")
    print(f"🎯 Target: {AGENT2_ADDRESS}")
    print(f"📍 Client: {client.address}\n")
    
    try:
        asyncio.run(run_client())
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
