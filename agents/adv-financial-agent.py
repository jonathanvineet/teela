from uagents import Agent, Context, Model, Protocol


class Message(Model):
    message: str  # EXACT SAME as local client

# Your financial advisor agent
agent = Agent(
    name="FinancialChat_Advanced",
    seed="financial-chat-advanced-seed"
)

# Create a protocol for handling messages
message_protocol = Protocol("MessageProtocol")


def process_financial_query(query: str) -> str:
    """Process financial queries with AI logic"""
    query_lower = query.lower()

    if "debt" in query_lower or "loan" in query_lower:
        return "⚠️ Strategy: Pay high-interest debts first. Then split the rest — 30% savings, 20% investments."
    elif "invest" in query_lower or "portfolio" in query_lower:
        return "📊 Advanced tip: Diversify across equities (60%), bonds (30%), and crypto (≤10%). Rebalance every quarter."
    elif "budget" in query_lower:
        return "📋 Follow the 50/30/20 rule — 50% needs, 30% wants, 20% savings/investments."
    elif "income" in query_lower:
        return "💰 Automate 20% of income to SIPs and recurring deposits before spending. 'Pay yourself first' works wonders."
    elif "retirement" in query_lower:
        return "👴 Plan for retirement early — invest in long-term growth assets and use compounding calculators regularly."
    elif "goal" in query_lower:
        return "🎯 Let's define a SMART goal: specific, time-bound, and measurable. For example, 'Save ₹10L in 5 years.'"
    elif "tax" in query_lower:
        return "📊 Use tax-advantaged accounts (401k, IRA, 529) to reduce tax burden. Consult a tax advisor for strategies."
    elif "emergency" in query_lower:
        return "🛡️ Build an emergency fund of 6-12 months of expenses. Keep it in a liquid, low-risk account."
    elif "risk" in query_lower:
        return "⚖️ Higher risk = higher potential returns. Match your portfolio risk to your time horizon and comfort level."
    else:
        return "I'm your advanced financial advisor. Ask me about debt, investments, budgeting, retirement, taxes, emergency funds, or risk management!"

@message_protocol.on_message(model=Message)
async def handle_message(ctx: Context, sender: str, msg: Message):
    ctx.logger.info(f"📨 Received from {sender}: {msg.message}")

    # Process the financial question
    response = process_financial_query(msg.message)

    # Send response back
    await ctx.send(sender, Message(message=response))
    ctx.logger.info(f"📤 Sent response: {response}")

# Include the protocol
agent.include(message_protocol)

if __name__ == "__main__":
    print(f"✅ Financial Advisor Agent Ready")
    print(f"📍 Address: {agent.address}")
    print(f"🚀 Starting...\n")
    agent.run()
