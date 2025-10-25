"""
INVESTMENT STRATEGY ADVISOR AGENT
---------------------------------
Specializes in:
• Portfolio allocation
• Risk management
• Investment planning
"""

from uagents import Agent, Context, Model, Protocol
import re

# ==============================
# MODELS
# ==============================


class Message(Model):
    message: str

# ==============================
# AGENT CONFIGURATION
# ==============================
agent = Agent(
    name="InvestmentStrategyAdvisor",
    seed="investment-strategy-advisor-seed-2025"
)

message_protocol = Protocol("InvestmentStrategyProtocol")

print("Investment Strategy Advisor Agent")
print(f"Address: {agent.address}")
print("Specialty: Portfolio allocation, investment planning, risk management")
print("=" * 60 + "\n")

# ==============================
# MAIN ANALYSIS LOGIC
# ==============================


def analyze_investment_query(query: str) -> str:
    """Analyze investment query and route to the right advice function."""
    query_lower = query.lower()

    # Extract investment amount if mentioned (first match)
    amounts = re.findall(r'\$?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)', query)
    investment_amount = float(amounts[0].replace(',', '')) if amounts else 0.0

    # Route query to specialized functions
    if any(word in query_lower for word in ['beginner', 'start', 'first time', 'new to']):
        return _beginner_investment_guide(investment_amount)
    elif any(word in query_lower for word in ['portfolio', 'allocation', 'diversify']):
        return _portfolio_allocation_advice(investment_amount, query_lower)
    elif any(word in query_lower for word in ['retirement', '401k', 'ira', 'roth']):
        return _retirement_investing_advice(investment_amount)
    elif any(word in query_lower for word in ['stock', 'equity', 'share']):
        return _stock_investing_advice()
    elif any(word in query_lower for word in ['etf', 'index fund', 'mutual fund']):
        return _fund_investing_advice()
    elif any(word in query_lower for word in ['crypto', 'bitcoin', 'ethereum']):
        return _crypto_investing_caution()
    elif any(word in query_lower for word in ['risk', 'safe', 'conservative', 'aggressive']):
        return _risk_tolerance_advice(query_lower)
    else:
        return _general_investment_principles(investment_amount)

# ==============================
# SPECIALIZED ADVICE FUNCTIONS
# ==============================


def _beginner_investment_guide(amount: float) -> str:
    monthly = amount if amount > 0 else 500
    return f"""
BEGINNER INVESTMENT GUIDE
-------------------------
Step 1: Foundation
 - Build emergency fund ($1,000)
 - Learn basic concepts (stocks, bonds, ETFs)

Step 2: Tax-Advantaged Accounts
 - 401(k) up to employer match
 - Open Roth IRA if eligible
 - Use HSA for healthcare savings

Step 3: Simple Portfolio
 - Auto-invest ${monthly}/month in index funds

Starter Portfolio:
 - 70% Total Stock Market Index
 - 20% International Stocks
 - 10% Bonds

Compound Growth:
 {monthly}/month at 8% return:
 - 10 years: {int(monthly * 183):,}
 - 20 years: {int(monthly * 589):,}
 - 30 years: {int(monthly * 1490):,}
"""


def _portfolio_allocation_advice(amount: float, query: str) -> str:
    young = any(word in query for word in ['young', '20s', '30s', 'aggressive'])
    old = any(word in query for word in ['retire', '50s', '60s', 'conservative'])
    return f"""
PORTFOLIO ALLOCATION STRATEGY
-----------------------------
Rule of Thumb:
Stock % = 110 - Age (remainder in bonds)

3-Fund Portfolio:
 - {(70 if young else 50 if old else 60)}% US Stocks
 - {(25 if young else 30 if old else 25)}% International Stocks
 - {(5 if young else 20 if old else 15)}% Bonds

Why it works:
 - Diversified
 - Low fees
 - Easy to rebalance annually
"""


def _retirement_investing_advice(amount: float) -> str:
    return """
RETIREMENT INVESTING STRATEGY
-----------------------------
1. Contribute to 401(k) up to employer match
2. Max out Roth IRA ($7,000/year)
3. Max 401(k) contributions ($23,000/year)
4. Use HSA for triple tax benefits

4% Rule:
Retirement savings * 0.04 = Annual withdrawal
Goal: 25× annual expenses
"""


def _stock_investing_advice() -> str:
    return """
STOCK INVESTING PRINCIPLES
--------------------------
- Invest only 5-10% in individual stocks
- Check fundamentals (P/E < 20, ROE > 15%)
- Avoid hype and meme stocks
- Consider sector ETFs instead (VGT, VFH, VHT)
"""


def _fund_investing_advice() -> str:
    return """
ETF & INDEX FUND INVESTING
--------------------------
Core Funds:
 - Total Stock Market (VTI)
 - S&P 500 Index (VOO)
 - International (VXUS)
 - Bonds (BND)

3-Fund Portfolio:
 - 60% VTI, 30% VXUS, 10% BND
Rebalance annually for stability.
"""


def _crypto_investing_caution() -> str:
    return """
CRYPTO INVESTING WARNING
------------------------
Treat crypto as speculation, not investment.
Invest max 5% of portfolio.

Tier 1: BTC, ETH
Avoid: meme coins, yield >20%, unverified projects.
Use reputable exchanges only.
"""


def _risk_tolerance_advice(query: str) -> str:
    if 'conservative' in query or 'safe' in query:
        allocation = "40% Stocks / 60% Bonds"
    elif 'aggressive' in query:
        allocation = "90% Stocks / 10% Bonds"
    else:
        allocation = "60% Stocks / 40% Bonds"

    return f"""
RISK TOLERANCE GUIDE
--------------------
Recommended allocation: {allocation}
Rebalance yearly to maintain target.
Diversify and stay invested long-term.
"""


def _general_investment_principles(amount: float) -> str:
    invest_amount = amount if amount > 0 else 500
    return f"""
GENERAL INVESTMENT PRINCIPLES
-----------------------------
1. Start early and stay consistent
2. Automate monthly investing (${invest_amount}/month)
3. Keep fees under 0.2%
4. Diversify globally
5. Rebalance annually
6. Ignore short-term market noise
"""

# ==============================
# MESSAGE HANDLER
# ==============================
@message_protocol.on_message(model=Message)
async def handle_message(ctx: Context, sender: str, msg: Message):
    ctx.logger.info(f"Received query from {sender[:10]}...")
    response = analyze_investment_query(msg.message)
    await ctx.send(sender, Message(message=response))
    ctx.logger.info(f"Advice sent ({len(response)} chars).")

# ==============================
# RUN AGENT
# ==============================
agent.include(message_protocol)

if __name__ == "__main__":
    print("Investment Strategy Advisor Ready!")
    agent.run()
