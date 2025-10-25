"""
DEBT MANAGEMENT SPECIALIST AGENT
Specializes in: Debt elimination strategies, loan optimization, credit management
"""

from uagents import Agent, Context, Model, Protocol
import re


class Message(Model):
    message: str

# Agent configuration
agent = Agent(
    name="DebtManagementSpecialist",
    seed="debt-management-specialist-seed-2025"
)

message_protocol = Protocol("DebtManagementProtocol")

print(f"💳 Debt Management Specialist Agent")
print(f"📍 Address: {agent.address}")
print(f"🎯 Specialty: Debt elimination, loan optimization, credit repair")
print(f"{'='*60}\n")


def analyze_debt_query(query: str) -> str:
    """
    Advanced debt analysis with multiple strategies
    """
    query_lower = query.lower()

    # Extract numbers (debt amounts)
    debt_amounts = re.findall(r'\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', query)
    total_debt = sum(float(amt.replace(',', '')) for amt in debt_amounts) if debt_amounts else 0

    # Detect debt type
    has_credit_card = any(word in query_lower for word in ['credit card', 'cc debt', 'card balance'])
    has_student_loan = any(word in query_lower for word in ['student loan', 'education loan', 'college debt'])
    has_mortgage = any(word in query_lower for word in ['mortgage', 'home loan', 'house payment'])
    has_personal_loan = any(word in query_lower for word in ['personal loan', 'bank loan'])

    # Strategy selection based on keywords
    if 'consolidate' in query_lower or 'consolidation' in query_lower:
        return _debt_consolidation_advice(total_debt)
    elif 'payoff' in query_lower or 'pay off' in query_lower:
        return _payoff_strategy_advice(has_credit_card, has_student_loan, total_debt)
    elif 'credit score' in query_lower or 'credit repair' in query_lower:
        return _credit_repair_advice()
    elif 'interest' in query_lower or 'apr' in query_lower:
        return _interest_reduction_advice()
    elif total_debt > 0:
        return _general_debt_strategy(total_debt, has_credit_card, has_student_loan)
    else:
        return _general_debt_education()


def _debt_consolidation_advice(total_debt: float) -> str:
    """Debt consolidation strategy"""
    response = [
        "💳 DEBT CONSOLIDATION STRATEGY:",
        "",
        "✅ Consolidation can simplify payments and potentially lower interest rates.",
        ""
    ]

    if total_debt > 10000:
        response.extend([
            f"📊 With ${total_debt:,.2f} in debt, consider:",
            "   1. Balance transfer card (0% APR for 12-18 months)",
            "   2. Personal consolidation loan (fixed rate 6-12%)",
            "   3. Home equity loan (if you own property - lowest rates)",
            "",
            "⚠️  WARNING: Consolidation only works if you stop accumulating new debt!"
        ])
    else:
        response.extend([
            f"📊 For ${total_debt:,.2f} in debt:",
            "   • Balance transfer credit card is your best option",
            "   • Look for 0% APR for 15-21 months",
            "   • Pay it off BEFORE the promotional period ends",
            "",
            "💡 TIP: Use the saved interest to pay down principal faster!"
        ])

    response.extend([
        "",
        "🎯 ACTION PLAN:",
        "   1. List all debts with interest rates",
        "   2. Compare consolidation offers",
        "   3. Calculate break-even point",
        "   4. Create aggressive payoff timeline"
    ])

    return "\n".join(response)


def _payoff_strategy_advice(has_credit_card: bool, has_student_loan: bool, total_debt: float) -> str:
    """Payoff strategy: Avalanche vs Snowball"""
    response = [
        "🎯 DEBT PAYOFF STRATEGY:",
        "",
        "Two proven methods:"
    ]

    if has_credit_card or total_debt > 5000:
        response.extend([
            "",
            "⚡ AVALANCHE METHOD (Mathematically optimal):",
            "   1. List debts by interest rate (highest first)",
            "   2. Pay minimums on all debts",
            "   3. Attack highest-interest debt with extra payments",
            "   4. Once paid, move to next highest rate",
            "",
            "💰 Saves most money on interest!",
            "",
            f"📊 For ${total_debt:,.2f}, this could save $1,000-3,000 in interest."
        ])

    response.extend([
        "",
        "❄️  SNOWBALL METHOD (Psychologically effective):",
        "   1. List debts by balance (smallest first)",
        "   2. Pay minimums on all debts",
        "   3. Attack smallest balance with extra payments",
        "   4. Once paid, roll that payment to next smallest",
        "",
        "🔥 Builds momentum and motivation!",
        ""
    ])

    if has_student_loan:
        response.extend([
            "🎓 STUDENT LOAN SPECIFIC:",
            "   • Consider income-driven repayment plans",
            "   • Look into Public Service Loan Forgiveness (if eligible)",
            "   • Refinance if interest rate > 6% and credit score > 700"
        ])

    response.extend([
        "",
        "💡 PRO TIP: Combine methods! Use Avalanche for high-interest debt,",
        "   Snowball for motivation on smaller balances."
    ])

    return "\n".join(response)


def _credit_repair_advice() -> str:
    """Credit score improvement strategies"""
    return """🔧 CREDIT REPAIR STRATEGY:

📈 Quick Wins (30-60 days):
   1. Pay down credit cards to <30% utilization
   2. Dispute errors on credit report (can boost 20-50 points)
   3. Become authorized user on someone's good account
   4. Pay all bills on time (set auto-pay!)

💳 Credit Utilization Formula:
   (Total Balances / Total Credit Limits) × 100
   Target: <10% for excellent score, <30% minimum

📊 Credit Score Factors:
   • 35% - Payment history (NEVER miss payments!)
   • 30% - Credit utilization (keep it low)
   • 15% - Length of credit history
   • 10% - New credit
   • 10% - Credit mix

🎯 90-Day Action Plan:
   Week 1: Pull free credit reports (annualcreditreport.com)
   Week 2: Dispute any errors
   Week 3-12: Pay down cards to <30% utilization

⚠️  DON'T close old accounts - hurts length of history!

💡 HACK: Pay credit cards TWICE per month to keep utilization low."""


def _interest_reduction_advice() -> str:
    """Interest rate reduction tactics"""
    return """💰 INTEREST RATE REDUCTION TACTICS:

📞 NEGOTIATION SCRIPT (Call your creditors):
   "Hi, I've been a loyal customer for X years with excellent payment
   history. I received offers from competitors at lower rates. Can you
   match or beat X% to keep my business?"

   Success rate: 40-60% for good payment history!

🔄 REFINANCING OPTIONS:

Credit Cards (15-25% → 0-6%):
   • Balance transfer to 0% APR card
   • Look for 15-21 month promotional periods
   • Watch for 3-5% transfer fees

Personal Loans (8-36% → 5-12%):
   • Refinance through online lenders
   • Requirements: 650+ credit score
   • Can save $50-200/month on $10k loan

Student Loans (6-9% → 3-5%):
   • Refinance if credit score > 700
   • Compare: SoFi, Earnest, CommonBond
   • ⚠️  Lose federal protections (forbearance, forgiveness)

Mortgage (4-7% → 2.5-4%):
   • Refinance if rate drops 0.75%+
   • Break-even: ~2-3 years
   • Consider points buydown if staying long-term

🎯 ROI CALCULATION:
   Monthly Savings × 12 Months × Years = Total Savings
   Compare to: Fees + Time Investment"""


def _general_debt_strategy(total_debt: float, has_credit_card: bool, has_student_loan: bool) -> str:
    """General debt strategy based on debt profile"""

    debt_to_action_ratio = total_debt / 1000  # Rough urgency metric

    response = [
        f"💳 COMPREHENSIVE DEBT STRATEGY FOR ${total_debt:,.2f}:",
        ""
    ]

    if total_debt < 5000:
        response.extend([
            "🟢 GOOD NEWS: This is manageable debt!",
            "",
            "⚡ AGGRESSIVE 6-MONTH PAYOFF PLAN:",
            f"   • Need to pay: ${total_debt/6:,.2f}/month",
            "   • Cut discretionary spending by 50%",
            "   • Pick up side gig for extra $500-1000/month",
            "   • Sell unused items (target: $500-1000)",
            ""
        ])
    elif total_debt < 20000:
        response.extend([
            "🟡 MODERATE DEBT: Requires disciplined approach",
            "",
            "📋 12-18 MONTH ELIMINATION PLAN:",
            f"   • Monthly payment target: ${total_debt/12:,.2f}",
            "   • Use Avalanche method for interest savings",
            "   • Consider balance transfer for high-interest debt",
            "   • Build emergency fund simultaneously (start small)",
            ""
        ])
    else:
        response.extend([
            "🔴 SIGNIFICANT DEBT: Need comprehensive strategy",
            "",
            "🎯 24-36 MONTH STRATEGIC PLAN:",
            f"   • Monthly payment: ${total_debt/24:,.2f}-${total_debt/36:,.2f}",
            "   • MUST consolidate high-interest debt",
            "   • Consider debt counseling (nonprofit NFCC member)",
            "   • Negotiate settlements if 90+ days past due",
            ""
        ])

    response.extend([
        "📊 DEBT FREEDOM FORMULA:",
        "   1. Stop accumulating new debt (freeze cards)",
        "   2. Build $1000 emergency fund (prevents new debt)",
        "   3. Attack debt with intensity",
        "   4. Build 3-6 month emergency fund",
        "",
        "💡 MOTIVATION: At your current trajectory, debt-free in ",
        f"   {int(total_debt/500)} months with $500/month payments!"
    ])

    return "\n".join(response)


def _general_debt_education() -> str:
    """General debt education for non-specific queries"""
    return """💡 DEBT MANAGEMENT FUNDAMENTALS:

🎯 THE DEBT HIERARCHY (Pay in this order):

Tier 1 - EMERGENCY (Pay immediately):
   • Payday loans (400%+ APR!) - refinance ASAP
   • Debt in collections - negotiate settlement
   • Tax debt - IRS payment plan (avoid liens)

Tier 2 - HIGH PRIORITY (Attack aggressively):
   • Credit card debt (18-25% APR)
   • Personal loans (8-36% APR)
   • Car loans (4-12% APR)

Tier 3 - MODERATE PRIORITY (Steady payments):
   • Student loans (4-8% APR)
   • Low-interest personal loans (<6% APR)

Tier 4 - LOW PRIORITY (Minimum payments):
   • Mortgage (3-5% APR)
   • HELOC (4-7% APR)

📈 WHEN TO PAY OFF vs INVEST:
   • Debt >6% APR: Pay off first
   • Debt 4-6% APR: Split between payoff and investing
   • Debt <4% APR: Invest instead (market returns ~8-10%)

⚠️  DEBT WARNING SIGNS:
   • Using credit for necessities
   • Only paying minimums
   • Debt-to-income ratio >40%
   • Hiding debt from partner
   • Ignoring bills

🆘 NEED HELP? Contact NFCC (National Foundation for Credit Counseling)
   Free counseling, debt management plans, bankruptcy alternatives."""

@message_protocol.on_message(model=Message)
async def handle_message(ctx: Context, sender: str, msg: Message):
    """Handle incoming financial query about debt"""
    ctx.logger.info(f"📨 Received debt query from {sender[:20]}...")
    ctx.logger.info(f"📝 Query: {msg.message}")

    # Process the debt-related query
    response = analyze_debt_query(msg.message)

    # Send response back to TEELA
    await ctx.send(sender, Message(message=response))
    ctx.logger.info(f"✅ Sent debt advice ({len(response)} chars)")

# Include protocol
agent.include(message_protocol)

if __name__ == "__main__":
    print(f"🚀 Debt Management Specialist Ready!\n")
    agent.run()
