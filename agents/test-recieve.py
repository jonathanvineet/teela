from uagents import Agent, Context, Model
import subprocess
import time
import os
import json

class Message(Model):
    message: str

TARGET_AGENT = "agent1qgv43hgx4qvppqlpuq6ld5h5pesgs0jkd6na774jp245f2swcc9jk6nywzn"
SEED_PHRASE = "financial-client-unique-seed-999"

# File to track registration status
REGISTRATION_FILE = ".agent_registered"

# Create agent with mailbox=True
client = Agent(
    name="financial_client",
    seed=SEED_PHRASE,
    port=8132,
    mailbox=True
)

print(f"\n{'='*70}")
print(f"🎯 Financial Chat Client")
print(f"{'='*70}")
print(f"📍 Agent Address: {client.address}")
print(f"💰 Wallet Address: {client.wallet.address()}")
print(f"🎯 Target Agent: {TARGET_AGENT}")
print(f"{'='*70}\n")

# Check if already registered
if os.path.exists(REGISTRATION_FILE):
    try:
        with open(REGISTRATION_FILE, 'r') as f:
            reg_data = json.load(f)
            if reg_data.get('agent_address') == client.address:
                print(f"✅ Agent already registered and funded!")
                print(f"📍 Skipping funding and registration...\n")
                print(f"{'='*70}")
                print(f"🚀 STARTING AGENT WITH MAILBOX")
                print(f"{'='*70}\n")
            else:
                os.remove(REGISTRATION_FILE)  # Different agent, re-register
    except (json.JSONDecodeError, KeyError) as e:
        print(f"⚠️ Registration file corrupted: {e}")
        print(f"🔄 Removing corrupted file and re-registering...")
        os.remove(REGISTRATION_FILE)

# Only fund and register if not already done
if not os.path.exists(REGISTRATION_FILE):
    wallet_address = client.wallet.address()
    
    print(f"{'='*70}")
    print(f"💰 FIRST TIME SETUP: FUNDING WALLET")
    print(f"{'='*70}\n")
    
    try:
        print(f"🔄 Requesting funds from faucet...")
        result = subprocess.run([
            'curl', '-X', 'POST',
            '-H', 'Content-Type: application/json',
            '-d', f'{{"address":"{wallet_address}"}}',
            'https://faucet-dorado.fetch.ai/api/v3/claims'
        ], capture_output=True, text=True)
        
        if '"status":"ok"' in result.stdout:
            print(f"✅ Wallet funded successfully!")
            print(f"📝 Response: {result.stdout}\n")
        else:
            print(f"⚠️ Funding response: {result.stdout}\n")
    except Exception as e:
        print(f"❌ Auto-funding failed: {e}")
    
    print(f"{'='*70}")
    print(f"⏳ Waiting 15 seconds for funding to process...")
    print(f"{'='*70}\n")
    time.sleep(15)
    
    print(f"{'='*70}")
    print(f"🚀 STARTING AGENT (First Registration)")
    print(f"{'='*70}")
    print(f"\n⚠️ IMPORTANT: This will register on Almanac contract")
    print(f"   Click Inspector URL and connect via Mailbox")
    print(f"   Wait for: 'Successfully registered as mailbox agent'\n")
    print(f"{'='*70}\n")
    
    # Save registration status after first successful start
    @client.on_event("startup")
    async def save_registration(ctx: Context):
        # Wait a bit for registration to complete
        await asyncio.sleep(10)
        with open(REGISTRATION_FILE, 'w') as f:
            json.dump({
                'agent_address': client.address,
                'wallet_address': client.wallet.address(),
                'registered_at': time.time()
            }, f)
        ctx.logger.info("✅ Registration status saved")

@client.on_interval(period=3.0)
async def send_message(ctx: Context):
    user_input = input("You: ")
    
    if user_input.lower() in ['quit', 'exit']:
        ctx.logger.info("Shutting down...")
        return
    
    if user_input.strip():
        ctx.logger.info(f"🔵 Sending: {user_input}")
        try:
            await ctx.send(TARGET_AGENT, Message(message=user_input))
            ctx.logger.info(f"🟢 Message sent successfully")
            print("✅ Sent! Waiting for response...\n")
        except Exception as e:
            ctx.logger.error(f"🔴 Failed to send: {e}")
            print(f"❌ Error: {e}\n")

@client.on_message(model=Message)
async def handle_response(ctx: Context, sender: str, msg: Message):
    ctx.logger.info(f"🟢 Response received from {sender}")
    print(f"\n{'='*70}")
    print(f"🤖 Financial Advisor Response:")
    print(f"\n{msg.message}\n")
    print(f"{'='*70}\n")

if __name__ == "__main__":
    import asyncio
    client.run()