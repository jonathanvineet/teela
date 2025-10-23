"""
Simple uagents-based FinancialAdvisor demo agent.
Run:
  python -m venv .venv
  source .venv/bin/activate
  pip install uagents
  python agents/financial_advisor_agent.py

This agent listens on port 8000 (default for uagents) and responds to a simplified
spending advice request format.
"""

from uagents import Agent, Context, Message, Response
import asyncio

agent = Agent(
    name="FinancialAdvisor",
    seed="financial-advisor-seed-please-change",
    port=8000,
)


def analyze_spending(spending_data):
    # Simple category summary and advice heuristic
    categories = {}
    for item in spending_data:
        cat = item.get("category", "other")
        amt = float(item.get("amount", 0))
        categories[cat] = categories.get(cat, 0.0) + amt

    advice = []
    for category, amount in categories.items():
        if amount > 500:
            advice.append(f"High spending in {category}: consider cutting back.")
        elif amount > 200:
            advice.append(f"Moderate spending in {category}: watch for growth.")
    if not advice:
        advice.append("Your spending looks balanced across categories.")
    return " ".join(advice)


@agent.on_message(model=Message)
async def handle_message(ctx: Context, msg: Message):
    # Expect message.message to be a dict with 'spending_data': [{category,amount},...]
    payload = msg.message or {}
    spending_data = payload.get("spending_data", [])
    advice_text = analyze_spending(spending_data)
    resp = Response(response=advice_text)
    # reply to the sender (ctx.sender)
    await ctx.send(ctx.sender, resp)


if __name__ == "__main__":
    # Run the agent. This is blocking; use ctrl-c to stop.
    agent.run()
