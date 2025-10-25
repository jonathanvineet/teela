"""
BUDGET & SAVINGS EXPERT AGENT
Specializes in: Budgeting strategies, expense tracking, savings optimization
"""

from uagents import Agent, Context, Model, Protocol
import re


class Message(Model):
    message: str

agent = Agent(
    name="BudgetSavingsExpert",
    seed="budget-savings-expert-seed-2025"
)

message_protocol = Protocol("BudgetSavingsProtocol")

print(f"💰 Budget & Savings Expert Agent")
print(f"📍 Address: {agent.address}")
print(f"🎯 Specialty: Budgeting strategies, expense optimization, savings plans")
print(f"{'='*60}\n")


def analyze_budget_query(query: str) -> str:
    """Analyze budget-related queries"""
    query_lower = query.lower()

    # Extract income/amounts
    amounts = re.findall(r'\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', query)
    monthly_income = float(amounts.replace(',', '')) if amounts else 0

    # Detect budget topic
    if any(word in query_lower for word in ['start', 'create', 'make', 'begin', 'how to budget']):
        return _budget_getting_started(monthly_income)
    elif any(word in query_lower for word in ['50/30/20', '502030', '50 30 20']):
        return _503020_budget_rule(monthly_income)
    elif any(word in query_lower for word in ['zero', 'zero-based', 'every dollar']):
        return _zero_based_budgeting(monthly_income)
    elif any(word in query_lower for word in ['save', 'saving', 'savings']):
        return _savings_strategies(monthly_income)
    elif any(word in query_lower for word in ['emergency fund', 'rainy day']):
        return _emergency_fund_guide(monthly_income)
    elif any(word in query_lower for word in ['envelope', 'cash stuffing']):
        return _envelope_budgeting()
    elif any(word in query_lower for word in ['reduce', 'cut', 'lower', 'decrease', 'spend less']):
        return _expense_reduction_strategies()
    elif any(word in query_lower for word in ['track', 'tracking', 'monitor']):
        return _expense_tracking_guide()
    else:
        return _comprehensive_budgeting_guide(monthly_income)


def _budget_getting_started(income: float) -> str:
    """Budget basics for beginners"""
    if income == 0:
        income = 4000  # Default assumption

    return f"""🎯 BUDGETING BASICS: GET STARTED IN 4 STEPS

📊 STEP 1: CALCULATE YOUR INCOME
   Monthly take-home pay: ${income:,.2f}
   (After taxes, 401k, insurance)

   Include:
   ✅ Salary/wages
   ✅ Side hustle income
   ✅ Investment dividends
   ✅ Any regular income

📋 STEP 2: LIST ALL EXPENSES

Fixed Expenses (Same each month):
   • Rent/Mortgage: ${income*0.25:,.2f} (target 25% of income)
   • Car payment: ${income*0.10:,.2f} (target 10% max)
   • Insurance (health, auto, life)
   • Loan payments
   • Subscriptions

Variable Expenses (Changes monthly):
   • Groceries: ${income*0.10:,.2f} (10-15% target)
   • Gas/transportation
   • Utilities
   • Dining out
   • Entertainment
   • Clothing
   • Personal care

💡 STEP 3: CATEGORIZE BY PRIORITY

Needs (50% of income = ${income*0.5:,.2f}):
   • Housing
   • Transportation
   • Food (groceries)
   • Utilities
   • Insurance
   • Minimum debt payments

Wants (30% of income = ${income*0.3:,.2f}):
   • Dining out
   • Entertainment
   • Hobbies
   • Travel
   • Shopping
   • Subscriptions

Savings (20% of income = ${income*0.2:,.2f}):
   • Emergency fund
   • Retirement (401k, IRA)
   • Down payment savings
   • Debt payments above minimum

🎯 STEP 4: TRACK & ADJUST

Week 1: Set up tracking (app or spreadsheet)
Week 2-4: Track EVERY expense
Month 2: Analyze where money actually went
Month 3: Adjust categories based on reality

📱 BUDGETING TOOLS:

Free Apps:
   • Mint - Automatic tracking
   • YNAB - Zero-based budgeting (You Need A Budget)
   • EveryDollar - Simple interface
   • PocketGuard - Shows "safe to spend"

Spreadsheets:
   • Google Sheets template (free)
   • Excel budget templates
   • Custom tracking spreadsheet

🚨 COMMON BEGINNER MISTAKES:

❌ Being too restrictive (leads to burnout)
❌ Forgetting irregular expenses (car maintenance, gifts)
❌ Not tracking small purchases ($5 adds up!)
❌ Giving up after first month
❌ Comparing to others (your budget is personal!)

✅ SUCCESS TIPS:
   • Start simple (don't overcomplicate)
   • Review weekly for first 3 months
   • Adjust as needed (budget isn't set in stone)
   • Celebrate small wins!
   • Build in "fun money" category

🎯 YOUR FIRST MONTH BUDGET:

Income: ${income:,.2f}

Needs (50% = ${income*0.5:,.2f}):
   • Housing: ${income*0.25:,.2f}
   • Food: ${income*0.10:,.2f}
   • Transportation: ${income*0.08:,.2f}
   • Utilities: ${income*0.05:,.2f}
   • Insurance: ${income*0.02:,.2f}

Wants (30% = ${income*0.3:,.2f}):
   • Entertainment: ${income*0.10:,.2f}
   • Dining out: ${income*0.10:,.2f}
   • Shopping: ${income*0.05:,.2f}
   • Subscriptions: ${income*0.03:,.2f}
   • Misc: ${income*0.02:,.2f}

Savings (20% = ${income*0.2:,.2f}):
   • Emergency fund: ${income*0.10:,.2f}
   • Retirement: ${income*0.08:,.2f}
   • Goals: ${income*0.02:,.2f}

📈 AFTER 6 MONTHS:
   You'll know exactly where your money goes and can optimize!"""


def _503020_budget_rule(income: float) -> str:
    """50/30/20 budget breakdown"""
    if income == 0:
        income = 5000

    needs = income * 0.5
    wants = income * 0.3
    savings = income * 0.2

    return f"""📊 THE 50/30/20 BUDGET RULE

Based on your income of ${income:,.2f}:

🏠 NEEDS (50% = ${needs:,.2f}):
   Essential expenses you can't avoid:

   Housing (25-30%): ${income*0.27:,.2f}
   • Rent/mortgage
   • Property tax
   • Home/renters insurance
   • HOA fees

   Transportation (10-15%): ${income*0.12:,.2f}
   • Car payment
   • Gas
   • Auto insurance
   • Maintenance
   • Public transit

   Food (5-10%): ${income*0.08:,.2f}
   • Groceries only
   • NOT dining out (that's a want)

   Utilities (3-5%): ${income*0.04:,.2f}
   • Electric, gas, water
   • Internet, phone

   Insurance (2-5%): ${income*0.03:,.2f}
   • Health insurance premiums
   • Life insurance
   • Disability insurance

🎉 WANTS (30% = ${wants:,.2f}):
   Non-essential but enhance quality of life:

   Entertainment (5-10%): ${income*0.07:,.2f}
   • Streaming services
   • Movies, concerts
   • Hobbies
   • Gym membership

   Dining Out (5-10%): ${income*0.07:,.2f}
   • Restaurants
   • Coffee shops
   • Takeout/delivery

   Shopping (5-10%): ${income*0.07:,.2f}
   • Clothing beyond basics
   • Electronics
   • Home decor

   Travel (3-5%): ${income*0.04:,.2f}
   • Vacations
   • Weekend getaways

   Misc (2-5%): ${income*0.05:,.2f}
   • Personal care beyond basics
   • Gifts
   • Pet expenses

💰 SAVINGS & DEBT (20% = ${savings:,.2f}):
   Building wealth and security:

   Emergency Fund (5-10%): ${income*0.08:,.2f}
   • Until you have 6 months expenses
   • Then redirect to other goals

   Retirement (8-12%): ${income*0.10:,.2f}
   • 401(k) contributions
   • Roth IRA
   • HSA contributions

   Debt Payoff (0-5%): ${income*0.02:,.2f}
   • Extra payments beyond minimums
   • Focus on high-interest debt first

   Other Goals (0-5%): ${income*0.00:,.2f}
   • Down payment for house
   • Kids' college fund
   • Big purchases

📈 WHEN YOUR NEEDS EXCEED 50%:

If your needs are >50% (common in HCOL areas):

   Option 1: INCREASE INCOME
   • Side hustle
   • Ask for raise
   • Job switch for higher pay
   • Freelance/consulting

   Option 2: REDUCE HOUSING COST
   • Get roommate
   • Move to cheaper area
   • Negotiate rent
   • Rent out spare room (Airbnb)

   Option 3: ADJUST RATIOS TEMPORARILY
   • 60/20/20 while paying off debt
   • 50/25/25 (reduce wants, increase savings)
   • Review and revert in 12 months

🎯 OPTIMIZATION STRATEGIES:

Needs Optimization:
   • Refinance mortgage/auto loan
   • Bundle insurance for discounts
   • Negotiate phone/internet bills
   • Meal plan to reduce grocery costs
   • Carpools/public transit

Wants Optimization:
   • Audit subscriptions monthly
   • 30-day waiting rule for non-essentials
   • Cook at home 5x/week
   • Free entertainment (libraries, parks, hiking)
   • Buy quality over quantity (lasts longer)

Savings Optimization:
   • Automate savings on payday
   • Save windfalls (tax refund, bonus)
   • Round-up apps (Acorns, Qapital)
   • Savings challenges (52-week challenge)

⚠️  COMMON PITFALLS:

❌ Miscategorizing wants as needs
   "I need Netflix" → It's a want!
   "I need coffee shop drinks" → It's a want!

❌ Forgetting irregular expenses
   • Car registration: ${income*0.005:,.2f}/month
   • Gifts: ${income*0.02:,.2f}/month
   • Car maintenance: ${income*0.01:,.2f}/month

❌ Not adjusting for life changes
   • Got a raise? Increase savings!
   • Had a baby? Adjust needs category
   • Paid off car? Redirect that payment

✅ PROGRESS MILESTONES:

Month 1-3: Track and learn patterns
Month 4-6: Optimize and find savings
Month 7-12: Build good habits
Year 2: Needs should decrease to 45%, savings increase to 25%!

🎯 YOUR CHALLENGE:
   Try 50/30/20 for 3 months. Track everything.
   Then adjust ratios based on YOUR priorities and reality!"""


def _zero_based_budgeting(income: float) -> str:
    """Zero-based budgeting method"""
    return """💵 ZERO-BASED BUDGETING (Every Dollar Has a Job)

🎯 CONCEPT:
   Income - Expenses - Savings = $0

   Every dollar is assigned a purpose BEFORE the month begins.
   You're not spending to zero, you're PLANNING to zero!

📋 HOW IT WORKS:

STEP 1: Know Your Monthly Income
   {Calculate take-home pay after taxes}

STEP 2: List Every Expense & Savings Goal
   Give every dollar a specific job:

   Fixed Expenses:
   □ Rent: $________
   □ Car payment: $________
   □ Insurance: $________
   □ Subscriptions: $________

   Variable Expenses:
   □ Groceries: $________
   □ Gas: $________
   □ Restaurants: $________
   □ Entertainment: $________
   □ Personal: $________

   Savings Goals:
   □ Emergency fund: $________
   □ Vacation fund: $________
   □ Car repairs fund: $________
   □ Christmas gifts: $________

   Debt Payoff:
   □ Credit card extra: $________
   □ Student loan extra: $________

STEP 3: Subtract Until You Hit Zero
   Income - All Expenses - All Savings = $0

   If money left over → Assign it!
   • Extra debt payment
   • Increase savings
   • Fun money

   If overspent → Cut something!
   • Reduce wants category
   • Find creative solutions

📊 ZERO-BASED BUDGET TEMPLATE:

INCOME: $__________

GIVING (Optional, 0-10%):
   • Charity: $________
   • Tithing: $________
   • Gifts: $________
   = $________

SAVING (20%+):
   • Emergency fund: $________
   • Retirement (401k, IRA): $________
   • Sinking funds: $________
   = $________

HOUSING (25-30%):
   • Mortgage/rent: $________
   • Property tax: $________
   • Repairs/maintenance: $________
   • HOA fees: $________
   = $________

UTILITIES (5-8%):
   • Electric: $________
   • Gas: $________
   • Water: $________
   • Internet: $________
   • Phone: $________
   • Trash: $________
   = $________

FOOD (10-15%):
   • Groceries: $________
   • Restaurants: $________
   = $________

TRANSPORTATION (10-15%):
   • Car payment: $________
   • Gas: $________
   • Maintenance: $________
   • Insurance: $________
   = $________

INSURANCE (5-10%):
   • Health: $________
   • Life: $________
   • Disability: $________
   = $________

DEBT PAYOFF (varies):
   • Credit card: $________
   • Student loan: $________
   • Personal loan: $________
   = $________

PERSONAL (5-10%):
   • Clothing: $________
   • Hair/beauty: $________
   • Gym: $________
   • Fun money: $________
   = $________

LIFESTYLE (5-10%):
   • Entertainment: $________
   • Subscriptions: $________
   • Hobbies: $________
   = $________

MISCELLANEOUS (2-5%):
   • Stuff I forgot: $________
   = $________

TOTAL EXPENSES: $__________

INCOME - EXPENSES = $0 ✅

🎯 ZERO-BASED BUDGETING BENEFITS:

✅ No mystery spending
✅ Intentional with every dollar
✅ Forces prioritization
✅ Reduces impulse purchases
✅ Increases savings naturally
✅ Achieves goals faster

⚠️  CHALLENGES:

❌ Time-intensive (especially month 1)
❌ Requires discipline to stick to plan
❌ Irregular income makes it harder
❌ Need to adjust mid-month sometimes

💡 SOLUTIONS:

Irregular Income:
   • Budget based on LOWEST month
   • Extra income → Savings buffer
   • Build "income holding" account

Mid-Month Adjustments:
   • Something over budget? → Cut from another category
   • Got unexpected windfall? → Assign it immediately
   • Use "miscellaneous" as flexible buffer

Time Management:
   • Month 1: Takes 3-4 hours
   • Month 2-3: Takes 1-2 hours
   • Month 4+: Takes 30-60 minutes
   • Use previous month as template!

📱 ZERO-BASED BUDGETING TOOLS:

Apps:
   • YNAB (You Need A Budget) - $99/year
     Best for zero-based, has tutorials
   • EveryDollar - Free or $18/month premium
     Dave Ramsey's app
   • Goodbudget - Envelope budgeting
   • Mvelopes - Zero-based with auto-sync

Spreadsheets:
   • Google Sheets template (search "zero-based budget")
   • Excel with formulas
   • Pen and paper (old school but effective!)

🎯 YOUR ACTION PLAN:

Before Month 1:
   □ List all income sources
   □ List all known expenses
   □ Estimate variable expenses (guess high!)
   □ Choose tracking method

During Month 1:
   □ Track EVERY purchase
   □ Note when you go over category
   □ See where estimates were wrong

After Month 1:
   □ Adjust categories based on reality
   □ Look for savings opportunities
   □ Plan for month 2 with better data

🔥 PRO TIPS:

1. Budget meetings with partner/spouse
   • Once per month BEFORE month starts
   • Agreement on priorities
   • Both involved = both accountable

2. "Fun money" categories for each person
   • $50-200/month each
   • No questions asked spending
   • Prevents resentment

3. Sinking funds for irregular expenses
   • Christmas: $100/month → $1200 in December
   • Car repairs: $50/month → $600 ready when needed
   • Prevents budget shock!

4. Pay yourself first
   • Savings/debt at TOP of budget
   • Not "whatever's left over"

5. Leave buffer ($50-100)
   • For true miscellaneous
   • Rolls over to next month if unused

REMEMBER: Budget is just a plan. Life happens. Adjust and keep going!"""


def _savings_strategies(income: float) -> str:
    """Comprehensive savings strategies"""
    return f"""💰 ADVANCED SAVINGS STRATEGIES

Based on income of ${income:,.2f if income > 0 else '5,000'}/month

🎯 THE SAVINGS HIERARCHY:

Level 1: FOUNDATION ($1,000 → 1 month expenses)
   • Baby emergency fund
   • Liquid (savings account)
   • Prevents going into debt for small emergencies

   Timeline: 1-3 months
   Action: Cut all non-essentials, side hustle, sell stuff

Level 2: EMPLOYER MATCH (Up to company match%)
   • 401(k) to employer match
   • Instant 50-100% return!
   • It's FREE MONEY

   Timeline: Immediate (start next paycheck)
   Action: Call HR, increase contribution to match

Level 3: HIGH-INTEREST DEBT (Pay off >7% APR)
   • Credit cards
   • High-interest loans
   • Mathematically better than investing

   Timeline: 6-24 months depending on amount
   Action: Debt avalanche method

Level 4: EMERGENCY FUND (3-6 months expenses)
   • Full emergency fund
   • Prevents financial catastrophe
   • Sleep-well-at-night money

   Timeline: 12-36 months
   Target: ${(income if income > 0 else 5000) * 3:,.2f} - ${(income if income > 0 else 5000) * 6:,.2f}

Level 5: MAX RETIREMENT (401k + IRA)
   • Max 401(k): $23,000/year
   • Max Roth IRA: $7,000/year
   • Tax advantages compound wealth

   Timeline: Ongoing
   Action: Increase 1% per year with raises

Level 6: OTHER GOALS (House, college, etc)
   • Down payment fund
   • 529 for kids
   • Taxable investments

   Timeline: Varies by goal
   Action: Separate savings accounts per goal

🚀 AGGRESSIVE SAVINGS STRATEGIES:

1. PAY YOURSELF FIRST (Automated):
   • Savings/investments auto-transfer on payday
   • Direct deposit split to multiple accounts
   • "Can't spend what you don't see"

   Setup:
   • 401(k): ${(income if income > 0 else 5000) * 0.10:,.2f}/month
   • Roth IRA: ${(income if income > 0 else 5000) * 0.12:,.2f}/month
   • Emergency fund: ${(income if income > 0 else 5000) * 0.08:,.2f}/month

2. SAVE ALL WINDFALLS (100% rule):
   • Tax refunds
   • Bonuses
   • Gifts
   • Overtime pay
   • Side hustle income

   Example: $3,000 bonus → $3,000 to savings
   (Don't adjust lifestyle)

3. CHALLENGE YOURSELF (Gamification):

   52-Week Challenge:
   • Week 1: Save $1
   • Week 2: Save $2
   • Week 52: Save $52
   • Total: $1,378 saved!

   No-Spend Challenge:
   • Pick one category (dining out, shopping, etc)
   • No spending for 30 days
   • Save what you would have spent

   $5 Bill Challenge:
   • Every $5 bill you get → Savings jar
   • Average: $200-300/year

   Spare Change Challenge:
   • Round up all purchases to nearest $1
   • Transfer difference to savings
   • Apps: Acorns, Qapital

4. PERCENTAGE-BASED SAVINGS:
   • Every raise: Save 50% of increase
   • Every promotion: Save 75% of increase
   • Every bonus: Save 100%

   Example: Got $200/month raise
   → Increase savings by $100/month
   → Still get $100/month lifestyle improvement

5. CATEGORY CUTS (The 10% Rule):
   • Reduce 3 categories by 10% each
   • Won't drastically impact lifestyle
   • Significant savings add up

   Example on $5,000 income:
   • Groceries $500 → $450 (save $50)
   • Dining $300 → $270 (save $30)
   • Entertainment $200 → $180 (save $20)
   = $100/month saved = $1,200/year!

💡 PSYCHOLOGICAL SAVINGS HACKS:

1. SEPARATE ACCOUNTS (Out of sight, out of mind):
   • Different bank for savings
   • No debit card for savings account
   • Makes it "harder" to access

2. VISUALIZATION (Make it real):
   • Print picture of goal (house, vacation, etc)
   • Progress tracker on fridge
   • Savings thermometer visual

3. ACCOUNTABILITY PARTNER:
   • Tell someone your goal
   • Weekly check-ins
   • Social pressure = motivation

4. AUTOMATE EVERYTHING:
   • Set it once, forget it
   • Removes willpower from equation
   • Consistency beats intensity

5. PAY WITH CASH (Envelope method):
   • Physical pain of spending
   • Visible depletion of resources
   • Naturally spend 15-20% less

📊 SAVINGS RATE TARGETS:

Aggressive: 50%+ of income
   • Retire in 17 years
   • Example: ${(income if income > 0 else 5000) * 0.5:,.2f}/month
   • Requires extreme lifestyle optimization

High: 30-50% of income
   • Retire in 20-28 years
   • Example: ${(income if income > 0 else 5000) * 0.4:,.2f}/month
   • Balanced lifestyle + strong savings

Moderate: 20-30% of income
   • Retire in 28-37 years
   • Example: ${(income if income > 0 else 5000) * 0.25:,.2f}/month
   • Comfortable lifestyle

Minimum: 15-20% of income
   • Retire at 65 (traditional)
   • Example: ${(income if income > 0 else 5000) * 0.17:,.2f}/month
   • Baseline recommendation

Insufficient: <15% of income
   • May not have enough for retirement
   • Need to increase or work longer

🎯 WHERE TO KEEP SAVINGS:

Emergency Fund (3-6 months):
   • High-yield savings account (4-5% APY)
   • Marcus, Ally, American Express
   • FDIC insured, liquid
   • Target: ${(income if income > 0 else 5000) * 4:,.2f}

Short-term goals (<5 years):
   • High-yield savings (same as above)
   • Money market account
   • Short-term CDs (6-24 months)
   • I-Bonds (if can lock for 1 year)

Medium-term goals (5-10 years):
   • 60% bonds / 40% stocks
   • Target-date fund
   • Balanced index fund

Long-term goals (10+ years):
   • 80-100% stocks
   • Index funds (VTI, VXUS)
   • Roth IRA
   • 401(k)

⚠️  SAVINGS MISTAKES TO AVOID:

❌ Keeping too much in checking
   • Opportunity cost (no interest)
   • Easy to spend impulsively

❌ Savings in regular savings (<0.5% APY)
   • Losing to inflation
   • Use high-yield savings (4-5%)

❌ Investing emergency fund
   • May need to sell at loss during crash
   • Emergency fund = SAFETY, not growth

❌ Waiting to "have more money"
   • Best time to start: NOW
   • Even $50/month adds up

❌ No specific goals
   • "Save money" is too vague
   • Specific = motivating

🔥 EXTREME SAVINGS MODE (If needed):

For 3-6 months to build emergency fund or pay off debt:

Housing:
   • Get roommate
   • Move back with parents temporarily
   • Rent out spare room (Airbnb)
   • House hack (rent covers mortgage)

Transportation:
   • Sell expensive car, buy cheap cash car
   • Bike/walk when possible
   • Carpool
   • Public transit

Food:
   • Meal prep all meals
   • Rice and beans, beans and rice
   • No dining out (ZERO)
   • Coupons and sales only

Entertainment:
   • Free activities only
   • Cancel all subscriptions
   • Library for movies/books
   • Hiking, parks, free events

Income:
   • Side hustle ($500-1500/month)
   • Sell possessions
   • Overtime at work
   • Gig economy (DoorDash, Uber)

Potential savings: $1,000-2,000/month extra!

💰 THE COMPOUND EFFECT:

Save ${(income if income > 0 else 5000) * 0.2:,.2f}/month for 30 years at 8%:
   Total: ${int((income if income > 0 else 5000) * 0.2 * 1490):,}!

Your contributions: ${int((income if income > 0 else 5000) * 0.2 * 360):,}
Investment growth: ${int((income if income > 0 else 5000) * 0.2 * 1130):,}

💵 Compound interest makes you RICH!"""


def _emergency_fund_guide(income: float) -> str:
    """Emergency fund guidance"""
    if income == 0:
        income = 5000

    return f"""🛡️  EMERGENCY FUND: YOUR FINANCIAL SAFETY NET

💰 WHY YOU NEED AN EMERGENCY FUND:

Statistics:
   • 78% of Americans live paycheck-to-paycheck
   • 40% can't cover a $400 emergency
   • One emergency = debt spiral

Without Emergency Fund:
   ❌ Car breaks → Credit card debt
   ❌ Medical bill → Payday loan
   ❌ Job loss → Can't pay rent
   ❌ Home repair → Borrow from 401(k)

With Emergency Fund:
   ✅ Car breaks → Pay cash, no stress
   ✅ Medical bill → Covered
   ✅ Job loss → 3-6 months runway
   ✅ Home repair → No debt needed

📊 EMERGENCY FUND TIERS:

Tier 1: STARTER FUND ($1,000)
   • First milestone
   • Covers minor emergencies
   • Prevents small debts
   • Build in 1-3 months

   How:
   • Sell stuff ($500)
   • Side hustle ($300)
   • Cut expenses ($200)

Tier 2: ONE MONTH EXPENSES (${income:,.2f})
   • Covers rent + essentials for 1 month
   • Breathing room for minor crisis
   • Build in 3-6 months

   Monthly savings needed: ${income/3:,.2f} for 3 months

Tier 3: THREE MONTHS (${income*3:,.2f})
   • Industry standard minimum
   • Short job search covered
   • Most emergencies handled
   • Build in 6-18 months

   Monthly savings needed: ${income*3/12:,.2f} for 12 months

Tier 4: SIX MONTHS (${income*6:,.2f})
   • Recommended for most people
   • Extended job search
   • Multiple emergencies
   • Peace of mind
   • Build in 12-36 months

   Monthly savings needed: ${income*6/24:,.2f} for 24 months

Tier 5: ONE YEAR (${income*12:,.2f})
   • For self-employed
   • Irregular income
   • Single income household
   • High job loss risk

📈 HOW MUCH DO YOU NEED?

Calculate your monthly expenses:
   Housing: $________
   Food: $________
   Transportation: $________
   Utilities: $________
   Insurance: $________
   Minimum debt payments: $________
   Basic necessities: $________
   = Total: $________

Multiply by 3-6 months:
   3 months = Total × 3
   6 months = Total × 6

🎯 EMERGENCY FUND FACTORS:

LARGER FUND NEEDED IF:
   • Self-employed or commission-based income
   • Single income household
   • Job market is competitive
   • Health issues
   • Old car or home (repair risks)
   • Supporting dependents

   → Target: 6-12 months

SMALLER FUND OK IF:
   • Dual income household
   • Stable government/healthcare job
   • Strong family support system
   • Minimal dependents
   • Good health

   → Target: 3-6 months

🏦 WHERE TO KEEP YOUR EMERGENCY FUND:

✅ BEST OPTIONS (High-Yield Savings):

Marcus by Goldman Sachs: 4.5% APY
   • FDIC insured
   • No fees
   • Easy online access
   • Earnings: ${income*6*0.045/12:.2f}/month on ${income*6:,.2f}

Ally Bank: 4.35% APY
   • Same benefits as Marcus
   • Great mobile app

American Express Savings: 4.35% APY
   • Reliable institution
   • FDIC insured

❌ AVOID:

Traditional Bank Savings: 0.01% APY
   • Losing to inflation
   • Opportunity cost
   • Example: Only ${income*6*0.0001/12:.2f}/month on ${income*6:,.2f}!

Checking Account:
   • Too accessible (tempting to spend)
   • Usually 0% interest

Under Mattress:
   • Inflation eats value
   • Fire/theft risk
   • Zero growth

Investments (Stocks/Crypto):
   • Too volatile
   • May need to sell at loss
   • Not liquid enough
   • Emergency fund ≠ investment

💡 BUILDING YOUR EMERGENCY FUND:

Fast Track (3-6 months):
   1. Cut all non-essentials ($500-1000/month savings)
   2. Side hustle evenings/weekends ($500-1000/month)
   3. Sell unused items ($500-2000 one-time)
   4. Direct deposit split (auto-save)
   5. Tax refund/bonus directly to fund

   Result: ${income*3:,.2f} in 3-6 months!

Steady Approach (12-24 months):
   1. Auto-transfer ${income*0.15:,.2f}/month
   2. Save all windfalls (tax refund, bonus)
   3. Round-up savings app
   4. Increase by 1% every 3 months

   Result: ${income*6:,.2f} in 24 months

🚨 WHAT COUNTS AS AN EMERGENCY?

✅ TRUE EMERGENCIES:
   • Job loss
   • Medical emergency
   • Essential car repair (need for work)
   • Home emergency (broken furnace, roof leak)
   • Emergency travel (family crisis)
   • Unexpected essential expense

❌ NOT EMERGENCIES:
   • Vacation
   • New clothes
   • Gifts
   • Non-essential car upgrade
   • Latest iPhone
   • "Great deal" on something
   • Anything you knew was coming

🔄 USING & REBUILDING:

If You Use Emergency Fund:
   1. Don't feel guilty (that's its purpose!)
   2. Pause other financial goals temporarily
   3. Rebuild as priority #1
   4. Get back to full amount ASAP

   Rebuilding priority:
   1. Stop all non-essential spending
   2. Side hustle if needed
   3. Pause extra debt payments (minimums only)
   4. Pause investment contributions temporarily
   5. Refill emergency fund first!

📊 EMERGENCY FUND MILESTONES:

$1,000: 🎉 You're ahead of 40% of Americans!
$5,000: 🎉 You can handle most emergencies!
$10,000: 🎉 You have real financial security!
$25,000: 🎉 You're in elite company!

⚠️  COMMON MISTAKES:

❌ Investing emergency fund (too risky)
❌ Keeping it too accessible (spend on non-emergencies)
❌ Not replenishing after use
❌ Starting to invest before building emergency fund
❌ Quitting because goal seems too large

✅ SUCCESS STRATEGIES:

Automate:
   • Set up auto-transfer on payday
   • Direct deposit split
   • Round-up apps

Separate Account:
   • Different bank than checking
   • No debit card
   • Labeled "EMERGENCY ONLY"

Track Progress:
   • Visual progress bar
   • Celebrate milestones
   • Monthly check-in

Protect It:
   • Only access for TRUE emergencies
   • If unsure, wait 24 hours
   • Ask: "Will I regret this in 6 months?"

🎯 YOUR ACTION PLAN:

Week 1:
   □ Calculate monthly expenses
   □ Determine 3-6 month target
   □ Open high-yield savings account

Week 2:
   □ Set up auto-transfer from checking
   □ Start with ${income*0.10:,.2f}/month (10% of income)
   □ Find $100-200 to cut from budget

Month 2-3:
   □ Side hustle for extra $300-500/month
   □ Sell unused items
   □ All extra money → Emergency fund

Month 6:
   □ Have $1,000+ milestone!
   □ Continue building to ${income*3:,.2f}

Month 12-24:
   □ Reach 3-6 month goal
   □ Celebrate!!!
   □ Now focus on other financial goals

💰 THE PEACE OF MIND:
   Emergency fund = Freedom from financial anxiety
   Worth more than any material purchase!"""


def _envelope_budgeting() -> str:
    """Physical envelope budgeting method"""
    return """💵 ENVELOPE BUDGETING SYSTEM

🎯 CONCEPT:
   Cash divided into envelopes for each spending category.
   When envelope is empty, you're done spending in that category!

📝 HOW IT WORKS:

STEP 1: List Your Variable Spending Categories
   Common categories:
   • Groceries
   • Gas
   • Restaurants/Dining out
   • Entertainment
   • Clothing
   • Personal care
   • Gifts
   • Miscellaneous

STEP 2: Budget Each Category
   Example monthly budget:
   • Groceries: $600
   • Gas: $150
   • Restaurants: $200
   • Entertainment: $100
   • Clothing: $80
   • Personal: $50
   • Gifts: $100
   • Misc: $120
   Total: $1,400

STEP 3: Get Cash & Stuff Envelopes
   On payday:
   1. Go to bank/ATM
   2. Withdraw total amount ($1,400 in example)
   3. Get small bills ($20s and $10s preferred)
   4. Label envelopes or use pre-made ones
   5. Stuff cash into appropriate envelopes

STEP 4: Spend ONLY From Envelopes
   Rules:
   • Going grocery shopping? Take groceries envelope
   • Need gas? Take gas envelope
   • Date night? Take restaurant envelope
   • NO MOVING MONEY between envelopes mid-month!
   • Cash is gone = No more spending

💡 ENVELOPE BUDGETING BENEFITS:

Psychological Impact:
   ✅ Physical pain of spending (seeing cash leave)
   ✅ Visual reminder of budget limits
   ✅ Tangible progress (envelope gets thinner)
   ✅ Can't overspend (literally impossible)

Financial Results:
   • 18-23% reduction in spending (studies show)
   • Better awareness of spending habits
   • Eliminates impulse purchases
   • Forces prioritization

Simplicity:
   • No complicated apps
   • Works without smartphone
   • Partner/kids can easily understand
   • No need to track every transaction

🎯 VARIATIONS:

1. PARTIAL ENVELOPE SYSTEM:
   Use cash for "problem categories" only:
   • Dining out (if you overspend here)
   • Entertainment (impulse category)
   • Shopping (wants category)

   Keep other categories on card (easier tracking)

2. DIGITAL ENVELOPE SYSTEM:
   Apps that simulate envelopes:
   • Goodbudget
   • Mvelopes
   • YNAB (virtual envelopes)

   Pros: Security, auto-tracking, less cash handling
   Cons: Less psychological impact

3. WEEKLY ENVELOPE SYSTEM:
   Split monthly budget by 4 weeks:
   • $600/month groceries = $150/week
   • Refill envelopes each Monday
   • Better for frequent small purchases
   • Prevents front-loading spending

4. SINKING FUND ENVELOPES:
   Long-term savings categories:
   • Car repairs: $50/month → $600/year ready
   • Christmas gifts: $100/month → $1,200 in December
   • Vacation: $200/month → $2,400 for trip
   • Home maintenance: $75/month → $900 for repairs

⚠️  ENVELOPE SYSTEM CHALLENGES:

Security Concerns:
   • Carrying large amounts of cash
   • Risk of theft/loss
   • Solution: Keep envelopes at home, only carry what you need

Can't Use for Online Purchases:
   • Amazon, subscriptions, bills
   • Solution: Hybrid system (cash for in-person, card for online)

Partner Buy-In:
   • Both need to follow system
   • Solution: Budget meeting, mutual agreement

Some Merchants Don't Accept Cash:
   • Certain online-only businesses
   • Solution: Have one "online purchases" card with limit

Inconvenient at Times:
   • Running back home for forgotten envelope
   • Solution: Emergency $20 in wallet (must replace next day!)

📊 ENVELOPE SYSTEM SETUP GUIDE:

Physical Supplies Needed:
   □ Envelopes (15-20)
   □ Labels or markers
   □ Cash box or accordion file
   □ Receipt holder

Envelope Labels:
   WEEKLY ENVELOPES:
   □ Groceries
   □ Gas
   □ Personal spending

   MONTHLY ENVELOPES:
   □ Restaurants
   □ Entertainment
   □ Clothing
   □ Gifts
   □ Home/garden
   □ Kids activities

   SINKING FUNDS:
   □ Car maintenance
   □ Christmas/holidays
   □ Vacation
   □ Home repairs
   □ Medical/dental
   □ Annual subscriptions

🎯 MAKING IT WORK:

Week 1-2: Learning Phase
   • You'll forget envelopes
   • You'll overspend some categories
   • You'll want to "borrow" from other envelopes
   • DON'T GIVE UP! It gets easier!

Week 3-4: Adjustment Phase
   • Adjust category amounts based on reality
   • Find which categories need more/less
   • Develop new habits

Month 2-3: Smooth Operation
   • System becomes second nature
   • Spending naturally decreases
   • More money left over in envelopes

💡 ENVELOPE SYSTEM HACKS:

1. Color Code Envelopes:
   • Green = Money categories (income, savings)
   • Red = Fixed bills (utilities, rent)
   • Yellow = Variable spending (groceries, gas)
   • Blue = Fun money (entertainment, dining)

2. Transparent Envelopes:
   • See cash level without opening
   • Visual reminder of limits

3. Envelope Roll-Over Rule:
   • Leftover cash at month-end?
   • Option A: Roll to next month (budget boost!)
   • Option B: Move to savings
   • Option C: Split between both

4. Emergency Envelope:
   • $100-200 separate envelope
   • Only for true emergencies
   • Prevents envelope "borrowing"

5. Couple's Date Envelope:
   • Shared fun money
   • Both contribute equally
   • Prevents spending arguments

🔥 SUCCESS STORIES:

Typical Results After 6 Months:
   • Dining out: $400/month → $200/month
   • Groceries: $800/month → $600/month (less waste!)
   • Entertainment: $250/month → $120/month
   • Shopping: $300/month → $100/month

   Total Saved: $830/month = $9,960/year!

🚨 WARNING SIGNS TO QUIT:

If after 3 months:
   ❌ Constantly borrowing between envelopes
   ❌ Using credit card as "backup"
   ❌ Not replenishing envelopes regularly
   ❌ Causing relationship stress

   → Switch to different budgeting method!
   Envelope system isn't for everyone.

✅ SIGNS IT'S WORKING:

   ✅ Spending decreases naturally
   ✅ Less financial stress
   ✅ More money left at month-end
   ✅ Better communication about money
   ✅ Achieving financial goals faster

🎯 YOUR 30-DAY CHALLENGE:

Day 1: Set up envelopes and budget
Day 2-30: Use ONLY envelope cash for variable expenses
Day 31: Count remaining cash, calculate savings

   Average person saves 18-23% = $200-500/month!

   That's $2,400-6,000/year toward goals!

💰 THE ENVELOPE MINDSET:
   "If it's not in the envelope, I can't afford it."

   Simple. Effective. Proven since 1900s!"""


def _expense_reduction_strategies() -> str:
    """Comprehensive expense cutting guide"""
    return """✂️  EXPENSE REDUCTION: CUT $500-1000/MONTH

🎯 THE 3 RULES OF CUTTING EXPENSES:

Rule 1: Cut Painlessly First
   • Focus on subscriptions you don't use
   • Negotiate bills you pay anyway
   • Switch to generics (same quality)

Rule 2: Then Cut What You Won't Miss
   • Reduce frequency (dining out 2x/month vs 8x)
   • Downgrade (basic vs premium)
   • Find free alternatives

Rule 3: Finally, Cut What Hurts
   • Only if you MUST (debt crisis, job loss)
   • Temporary sacrifice for long-term gain
   • Time-bound (3-6 months only)

💰 CATEGORY-BY-CATEGORY CUTS:

🏠 HOUSING (25-30% of budget → Target: Save $100-300/month)

Painless Cuts:
   • Negotiate rent (10-15% decrease possible)
     Script: "I've been a great tenant. Comparable units are $X less. Can you match?"
   • Refinance mortgage (save $100-400/month)
   • Bundle insurance (save 15-25%)
   • Adjust thermostat (save $50-100/month)
     68°F winter, 78°F summer

Moderate Cuts:
   • Get a roommate (save $300-800/month)
   • Rent out spare room (Airbnb: $400-1000/month)
   • Move to cheaper place (save $200-500/month)
   • DIY repairs vs calling contractor

Drastic Cuts:
   • Move back with parents temporarily (save $1000-2000/month)
   • House hacking (rent covers mortgage)
   • Downsize significantly

🚗 TRANSPORTATION (10-15% → Target: Save $100-300/month)

Painless Cuts:
   • Shop insurance annually (save $200-500/year)
   • Drive efficiently (save 10-20% on gas)
     • No hard accelerations
     • Maintain speed limit
     • Proper tire pressure
   • GasBuddy app (save $5-10/tank)
   • Costco/Sam's Club gas (5-10% cheaper)

Moderate Cuts:
   • Carpool (save $50-150/month)
   • Public transit (save $200-400/month)
   • Bike to work when possible
   • Reduce trips (combine errands)
   • Cancel premium gas (usually unnecessary)

Drastic Cuts:
   • Sell expensive car, buy cheap cash car (save $300-600/month)
   • Sell car completely if feasible (save $500-800/month)
   • Move closer to work (save on commute)

🍔 FOOD (10-15% → Target: Save $200-400/month)

Painless Cuts:
   • Meal planning (reduces waste by 25%)
   • Generic brands (30-50% cheaper, same quality)
   • Bulk buying staples (rice, beans, pasta)
   • Shop sales/use coupons (save 20-30%)
   • Buy produce in season
   • Freeze leftovers
   • Pack lunch (save $200/month!)

Moderate Cuts:
   • Reduce dining out (8x → 2x/month saves $200)
   • Cook large batches (freeze portions)
   • Vegetarian meals (2-3x/week saves $80/month)
   • No food delivery (fees + tip = 50% markup!)
   • Water only at restaurants
   • Happy hour instead of dinner out

Drastic Cuts:
   • No dining out for 3 months (save $300-600/month)
   • Extreme meal prep (rice, beans, chicken)
   • Food pantries if needed (no shame!)
   • Dumpster diving (expired ≠ bad)

📺 ENTERTAINMENT (5-10% → Target: Save $50-150/month)

Painless Cuts:
   • Rotate subscriptions (cancel/resubscribe as needed)
     Have Netflix? Cancel Hulu. Next month switch.
   • Share family plans (split costs)
   • Library card (free: books, movies, audiobooks, magazines)
   • Free community events
   • Hiking, parks, beaches (free!)

Moderate Cuts:
   • Cancel cable (save $50-150/month)
     Use antenna + 1-2 streaming services
   • Cancel gym (home workouts/running free)
   • Matinee movies vs evening
   • Free museum days
   • Potluck dinners vs restaurants

Drastic Cuts:
   • Cancel ALL subscriptions (save $100-200/month)
   • No entertainment spending for 3 months
   • Only free activities
   • Library + free outdoor = entertainment

💳 SUBSCRIPTIONS (3-5% → Target: Save $50-150/month)

Audit ALL Subscriptions:
   □ Streaming (Netflix, Hulu, Disney+, etc)
   □ Music (Spotify, Apple Music)
   □ Software (Adobe, Office, etc)
   □ Apps (meditation, fitness, dating)
   □ Memberships (Amazon Prime, Costco)
   □ Magazines/Newspapers
   □ Subscription boxes
   □ Storage units
   □ Gym/fitness

   Cancel Checklist:
   • Used <2x/month? Cancel.
   • Free alternative exists? Cancel.
   • Can share family plan? Switch.
   • Annual cheaper than monthly? Switch.

Common Subscription Savings:
   • Netflix, Hulu, Disney+, HBO → Keep 1, rotate ($30/month saved)
   • Gym → YouTube workouts ($50/month saved)
   • Spotify → Free tier with ads ($10/month saved)
   • Amazon Prime → Do you really need? ($14/month saved)
   • Storage unit → Sell stuff instead! ($100/month saved)

🛒 SHOPPING (5-10% → Target: Save $100-200/month)

Painless Cuts:
   • 30-day rule (wait 30 days before buying wants)
   • Buy secondhand first (Facebook Marketplace, Craigslist)
   • Browser extension price trackers (Honey, CamelCamelCamel)
   • Cashback apps (Rakuten, Ibotta)
   • Buy quality once vs cheap repeatedly

Moderate Cuts:
   • No-buy challenge (1 category, 30-90 days)
   • Capsule wardrobe (fewer, better items)
   • Unsubscribe from promotional emails
   • Delete shopping apps
   • Pay with cash only (hurts more to spend)

Drastic Cuts:
   • Buy NOTHING new for 3-6 months
     (Except essentials: groceries, toiletries)
   • Sell unused items (clothing, electronics, furniture)
   • One-in-one-out rule

📱 TECHNOLOGY (2-5% → Target: Save $50-100/month)

Painless Cuts:
   • Call phone carrier (negotiate $10-20/month discount)
   • Switch to prepaid (Mint Mobile, Cricket: $15-30/month vs $70+)
   • Review phone plan (unlimited data needed?)
   • Bundle internet + phone
   • Buy own router vs renting (save $120/year)

Moderate Cuts:
   • Keep phone 4-5 years vs 2 years
   • Buy refurbished electronics (30-50% cheaper)
   • Cancel app subscriptions
   • Use free alternatives (LibreOffice vs Microsoft Office)

Drastic Cuts:
   • Switch to flip phone ($20/month)
   • Cancel internet (use phone hotspot)
   • No phone upgrade for 5+ years

💡 UTILITIES (3-5% → Target: Save $30-80/month)

Painless Cuts:
   • LED bulbs (75% less energy, last 20 years)
   • Smart power strips (eliminate phantom power)
   • Shorter showers (save 20% on water)
   • Full dishwasher loads only
   • Programmable thermostat (save 10-15%)
   • Weather-strip doors/windows
   • Close vents in unused rooms

Moderate Cuts:
   • Line dry clothes vs dryer
   • Lower water heater temp (120°F is fine)
   • Blackout curtains (keeps heat/cool in)
   • Cook multiple meals at once (oven efficiency)
   • Cold water laundry (works fine, saves energy)

Drastic Cuts:
   • No A/C (fans only)
   • Extreme thermostat settings (60°F winter, 82°F summer)
   • Very short/cold showers
   • Hand-wash dishes

🎁 GIFTS (1-3% → Target: Save $50-100/month)

Painless Cuts:
   • Homemade gifts (baked goods, crafts)
   • Experience gifts (time together vs things)
   • Secret Santa ($30 limit vs buying for everyone)
   • Agree on no-gift holidays with family

Moderate Cuts:
   • Kids: 3-gift rule (need, want, read)
   • Adults: Set dollar limits ($20-30)
   • DIY wrapping paper
   • Shop sales year-round (save 50%+)

Drastic Cuts:
   • No gifts (explain: "I'm in financial recovery")
   • Experiences only (hike together, movie night)

🏥 HEALTHCARE (5-10% of budget)

Painless Cuts:
   • Generic medications (FDA-required same active ingredients)
   • GoodRx for prescriptions (save 50-80%)
   • FSA/HSA for tax savings
   • Preventive care (cheaper than treatment!)
   • Negotiate medical bills (ask for discounts)

Moderate Cuts:
   • Telehealth vs in-person ($50 vs $200)
   • Urgent care vs ER (save $1000+)
   • Shop for procedures (price varies 300%!)
   • High-deductible plan + HSA (if healthy)

📊 TOTAL POTENTIAL SAVINGS:

Aggressive Cuts (3-6 month sprint):
   • Housing: $200
   • Transportation: $200
   • Food: $400
   • Entertainment: $100
   • Subscriptions: $100
   • Shopping: $200
   • Technology: $50
   • Utilities: $50
   • Gifts: $50
   = $1,350/month saved!
   = $16,200/year!

Moderate Cuts (sustainable long-term):
   • Housing: $100
   • Transportation: $100
   • Food: $200
   • Entertainment: $50
   • Subscriptions: $75
   • Shopping: $100
   • Technology: $30
   • Utilities: $30
   • Gifts: $30
   = $715/month saved!
   = $8,580/year!

💡 THE PSYCHOLOGY OF CUTTING:

Don't think: "I can't afford this"
Think: "I'm choosing to spend my money on [goal] instead"

Don't think: "I'm depriving myself"
Think: "I'm investing in my future"

Don't think: "This is forever"
Think: "This is temporary to achieve my goal"

🎯 YOUR 30-DAY CUTTING CHALLENGE:

Week 1: Audit Phase
   □ List ALL expenses for last 3 months
   □ Identify top 5 spending categories
   □ Find 3 painless cuts in each category

Week 2: Cancel Phase
   □ Cancel unused subscriptions
   □ Negotiate 3 bills
   □ Unsubscribe from promotional emails

Week 3: Replace Phase
   □ Find free alternatives to paid services
   □ Implement meal planning
   □ Start using library

Week 4: Calculate & Celebrate
   □ Calculate total savings
   □ Open high-yield savings
   □ Auto-transfer your savings!

Average result: $300-600/month saved!
That's $3,600-7,200/year toward your goals!

🔥 THE LATTE FACTOR MYTH:

Don't obsess over $5 lattes if you have:
   • $500 car payment (sell, buy cheaper)
   • $2000 rent (get roommate, saves $800)
   • $400 dining out (cook, saves $300)

Focus on BIG expenses first! Then optimize small ones.

✂️  REMEMBER: Every dollar saved is a dollar toward freedom!"""


def _expense_tracking_guide() -> str:
    """Expense tracking methods and tools"""
    return """📊 EXPENSE TRACKING MASTERY

🎯 WHY TRACK EXPENSES?

Statistics:
   • People spend 15-20% less when tracking
   • 76% who track reach financial goals
   • 42% who don't track don't know where money goes

Benefits:
   ✅ Identify spending leaks
   ✅ Hold yourself accountable
   ✅ Make informed decisions
   ✅ Achieve goals faster
   ✅ Reduce financial stress

📱 TRACKING METHODS (Choose One):

1. AUTOMATIC TRACKING (Easiest):

   Apps That Connect to Bank:
   • Mint (Free)
     ✅ Automatic categorization
     ✅ Budget tracking
     ✅ Bill reminders
     ✅ Credit score monitoring
     ❌ Ads, data security concerns

   • Personal Capital (Free)
     ✅ Investment tracking
     ✅ Net worth dashboard
     ✅ Retirement planner
     ❌ Targets wealthy users

   • YNAB - You Need A Budget ($99/year)
     ✅ Zero-based budgeting
     ✅ Educational resources
     ✅ Strong methodology
     ❌ Costs money, learning curve

   • Monarch (Recently bought Mint, $100/year)
     ✅ Clean interface
     ✅ Shared accounts (couples)
     ❌ Subscription cost

   Pros: Set-and-forget, automatic
   Cons: Security concerns, sometimes miscategorizes

2. MANUAL TRACKING (Most Effective):

   Spreadsheets:
   • Google Sheets (Free, cloud-based)
   • Excel
   • Numbers (Mac)

   Setup:
   Columns: Date | Category | Merchant | Amount | Payment Method

   Example:
   10/15 | Food | Grocery Store | $87.43 | Debit
   10/16 | Gas | Shell | $45.00 | Credit
   10/17 | Entertainment | Movie | $15.00 | Cash

   Pros: Full control, privacy, custom categories
   Cons: Time-intensive (10-15 min/day)

3. RECEIPT TRACKING (Hybrid):

   Take Photo of Every Receipt:
   • Expensify
   • Shoeboxed
   • Evernote

   At end of week: Categorize all receipts

   Pros: Physical proof, catch everything
   Cons: Can forget receipts, time to process

4. CASH ENVELOPE TRACKING:

   Physical cash in envelopes by category
   When empty = done spending

   Pros: Cannot overspend, very effective
   Cons: Inconvenient, security risk

5. BANK STATEMENT REVIEW (Minimum):

   Once per month:
   • Download bank statement
   • Highlight by category (different colors)
   • Total each category
   • Compare to budget

   Pros: Simple, no daily tracking
   Cons: Month-old data, easy to forget

🎯 EXPENSE CATEGORIES TO TRACK:

FIXED EXPENSES (Don't change month-to-month):
   □ Rent/Mortgage
   □ Car payment
   □ Insurance (auto, health, life)
   □ Phone bill
   □ Internet
   □ Subscriptions (Netflix, gym, etc)
   □ Loan payments

VARIABLE EXPENSES (Change monthly):
   □ Groceries
   □ Dining out
   □ Gas
   □ Electric/utilities
   □ Entertainment
   □ Shopping/clothing
   □ Personal care
   □ Home maintenance
   □ Pet expenses
   □ Medical/pharmacy
   □ Gifts

PERIODIC EXPENSES (Not every month):
   □ Car maintenance
   □ Car registration
   □ Home repairs
   □ Gifts (birthdays, holidays)
   □ Annual subscriptions
   □ Property tax
   □ HOA fees

💡 PRO TRACKING TIPS:

1. TRACK IMMEDIATELY:
   • Right after purchase (1 min vs hunting receipts later)
   • Use phone app/notes
   • Voice memo if driving

2. CATEGORIZE CONSISTENTLY:
   • Same merchant = same category always
   • Don't overthink (close enough is fine)
   • Amazon → If mostly groceries, categorize as groceries

3. WEEKLY REVIEW (Sunday ritual):
   • Check all accounts
   • Categorize week's expenses
   • Compare to budget
   • Adjust if needed
   • 15-30 minutes

4. MONTHLY DEEP DIVE:
   • End of month: Calculate totals
   • Compare to budget
   • Identify trends
   • Plan next month
   • 1-2 hours

5. SPLIT TRANSACTIONS:
   Target run: $50 groceries + $30 household = 2 entries
   More accurate category tracking

📊 TRACKING SCHEDULE:

Daily (2-3 minutes):
   • Record expenses as they happen
   • Take photos of receipts

Weekly (15-30 minutes):
   • Review all transactions
   • Categorize uncategorized
   • Check budget progress
   • Adjust spending if needed

Monthly (1-2 hours):
   • Total all categories
   • Compare to budget
   • Analyze trends
   • Plan next month's budget
   • Celebrate wins!

Quarterly (2-3 hours):
   • Big picture review
   • Adjust budget categories
   • Check progress on goals
   • Update financial plan

🎯 WHAT TO LOOK FOR WHEN REVIEWING:

RED FLAGS 🚩:
   • Spending > budget in category
   • Mystery transactions (fraud?)
   • Duplicate charges
   • Forgotten subscriptions
   • "One-time" purchases happening regularly
   • Increasing trend month-over-month

GREEN FLAGS ✅:
   • Under budget in categories
   • Decreasing trend
   • More money in savings
   • Debt going down
   • Net worth increasing

🔍 ANALYSIS QUESTIONS:

1. "What surprised me this month?"
   (Restaurant spending higher than expected?)

2. "What can I reduce next month?"
   (Cut dining out by 50%?)

3. "Were there any unnecessary purchases?"
   (Impulse buys?)

4. "What brought me the most value?"
   (Worth the money spent?)

5. "Am I progressing toward my goals?"
   (Emergency fund growing?)

💰 TRACKING MILESTONES:

Week 1: "I spent HOW MUCH on food?!"
   • Reality check
   • Eye-opening awareness
   • Identify problem areas

Month 1: "I know exactly where my money went"
   • Full picture of spending
   • Can make informed decisions

Month 3: "My spending naturally decreased"
   • Awareness → Behavior change
   • 10-15% spending reduction typical

Month 6: "I'm hitting my savings goals"
   • Tracking → Better decisions → Goal achievement

⚠️  TRACKING MISTAKES:

❌ Tracking but not reviewing
   • Data alone doesn't help
   • Must analyze and act

❌ Too many categories
   • Overcomplicated
   • Keep it simple (10-15 max)

❌ Beating yourself up
   • Budget is a tool, not a weapon
   • Adjust and keep going

❌ Comparing to others
   • Your budget is personal
   • Focus on YOUR progress

❌ Giving up after one bad month
   • One month doesn't matter
   • Trend over time matters

✅ TRACKING SUCCESS FORMULA:

1. Choose ONE method (don't overcomplicate)
2. Track consistently (daily habit)
3. Review weekly (15 min Sunday)
4. Analyze monthly (what changed?)
5. Adjust budget (based on reality)
6. Repeat!

🎯 YOUR 7-DAY TRACKING CHALLENGE:

Day 1: Choose tracking method, set up
Day 2-7: Track EVERY expense (yes, even $2 coffee!)
Day 8: Review week, calculate totals
Day 9: Adjust budget based on reality
Day 10-30: Continue tracking

Result: 15-20% spending reduction typical!

📱 RECOMMENDED SETUP:

Free Option:
   • Google Sheets template
   • Track daily (2 min)
   • Review weekly

Paid Option ($8/month):
   • YNAB app
   • Auto-syncs transactions
   • Built-in budgeting

Best Option (Free + Effective):
   • Mint for automatic tracking
   • Spreadsheet for monthly deep dive
   • Hybrid approach

💡 THE TRACKING TRUTH:

You can't manage what you don't measure.

Tracking isn't about restriction - it's about AWARENESS.

Awareness → Better decisions → Financial freedom!

Start TODAY! Track every expense for 7 days.
Your future self will thank you! 📈"""


def _comprehensive_budgeting_guide(income: float) -> str:
    """Comprehensive budgeting overview"""
    if income == 0:
        income = 5000

    return f"""💰 COMPLETE BUDGETING GUIDE

Based on income: ${income:,.2f}/month

🎯 BUDGETING FUNDAMENTALS:

What is a Budget?
   A plan for your money that ensures:
   ✅ All bills get paid
   ✅ You're saving for goals
   ✅ You have fun money
   ✅ You're building wealth

   NOT:
   ❌ A restriction
   ❌ Deprivation
   ❌ Punishment for past mistakes

📊 CHOOSING YOUR BUDGET METHOD:

1. 50/30/20 Budget (SIMPLEST):
   Best for: Beginners, busy people

   50% Needs: ${income*0.5:,.2f}
   30% Wants: ${income*0.3:,.2f}
   20% Savings: ${income*0.2:,.2f}

   Pros: Simple, flexible
   Cons: Not detailed enough for some

2. Zero-Based Budget (MOST EFFECTIVE):
   Best for: Detail-oriented, debt payoff

   Every dollar assigned before month starts
   Income - Expenses - Savings = $0

   Pros: Intentional, prevents overspending
   Cons: Time-intensive

3. Envelope Budget (CASH-BASED):
   Best for: Overspenders, visual learners

   Cash divided into category envelopes
   When empty = stop spending

   Pros: Cannot overspend
   Cons: Inconvenient, security risk

4. Pay Yourself First (AUTOMATED):
   Best for: Investors, savers

   Auto-transfer savings/investments first
   Live on what's left

   Pros: Builds wealth automatically
   Cons: May not address spending problems

5. Reverse Budget (MINIMALIST):
   Best for: High income, low expenses

   Track savings goal only
   Spend rest freely

   Pros: Simple, low maintenance
   Cons: Can enable overspending

📋 BUDGET CATEGORIES BREAKDOWN:

HOUSING (25-30% = ${income*0.27:,.2f}):
   • Rent/mortgage
   • Property tax
   • HOA fees
   • Repairs/maintenance
   • Home insurance

UTILITIES (5-8% = ${income*0.06:,.2f}):
   • Electric
   • Gas/heating
   • Water/sewer
   • Internet
   • Phone
   • Trash

TRANSPORTATION (10-15% = ${income*0.12:,.2f}):
   • Car payment
   • Gas
   • Insurance
   • Maintenance
   • Registration

FOOD (10-15% = ${income*0.12:,.2f}):
   • Groceries
   • Dining out

INSURANCE (5-10% = ${income*0.07:,.2f}):
   • Health
   • Life
   • Disability

SAVINGS (15-20% = ${income*0.17:,.2f}):
   • Emergency fund
   • Retirement
   • Goals

DEBT PAYOFF (Varies):
   • Credit cards
   • Student loans
   • Personal loans

PERSONAL (5-10% = ${income*0.07:,.2f}):
   • Clothing
   • Hair/beauty
   • Gym
   • Fun money

ENTERTAINMENT (5-10% = ${income*0.07:,.2f}):
   • Subscriptions
   • Hobbies
   • Travel

MISC (2-5% = ${income*0.03:,.2f}):
   • Gifts
   • Pets
   • Unexpected

🎯 CREATING YOUR FIRST BUDGET:

STEP 1: Calculate Income
   Take-home pay (after taxes): $__________
   Side hustle income: $__________
   Other income: $__________
   TOTAL MONTHLY INCOME: $__________

STEP 2: List All Expenses
   Fixed (same every month):
   □ Rent: $__________
   □ Car payment: $__________
   □ Insurance: $__________
   □ Subscriptions: $__________

   Variable (changes monthly):
   □ Groceries: $__________
   □ Gas: $__________
   □ Utilities: $__________
   □ Dining out: $__________

   Periodic (not every month):
   □ Car maintenance: $__________
   □ Gifts: $__________
   □ Annual fees: $__________

STEP 3: Subtract Expenses from Income
   Income - Expenses = $__________

   If POSITIVE: Assign to savings/debt!
   If NEGATIVE: Cut expenses or increase income!

STEP 4: Track Daily
   Record every expense
   Stay within category limits
   Adjust as needed

STEP 5: Review Monthly
   What worked?
   What didn't?
   Adjust for next month

💡 BUDGET OPTIMIZATION STRATEGIES:

Increase Income:
   • Ask for raise
   • Side hustle ($500-2000/month)
   • Freelance your skills
   • Sell unused items
   • Rent spare room

Decrease Fixed Expenses:
   • Refinance mortgage/loans
   • Negotiate insurance
   • Cancel unused subscriptions
   • Move to cheaper housing

Decrease Variable Expenses:
   • Meal planning
   • Generic brands
   • DIY when possible
   • Free entertainment

Automate Savings:
   • Auto-transfer to savings
   • Round-up apps
   • Direct deposit split

⚠️  COMMON BUDGETING MISTAKES:

❌ Being Too Restrictive:
   • No fun money = burnout
   • Include "wants" category!

❌ Forgetting Irregular Expenses:
   • Annual insurance
   • Car maintenance
   • Holiday gifts
   • Birthday celebrations

❌ Not Building Buffer:
   • $100-200 miscellaneous category
   • For truly unexpected expenses

❌ Comparing to Others:
   • Your budget is personal
   • Focus on YOUR goals and values

❌ Giving Up After One Bad Month:
   • Budgeting is a skill
   • Takes 3-6 months to master
   • Keep adjusting!

❌ Not Adjusting for Life Changes:
   • Got raise? Update budget!
   • Had baby? Adjust categories!
   • Paid off debt? Redirect payment!

✅ BUDGET SUCCESS HABITS:

1. Budget Before Month Begins:
   • Know your plan before spending
   • Prevents reactive decisions

2. Track Everything:
   • Every $2 coffee matters
   • Awareness prevents overspending

3. Review Weekly:
   • 15 minutes every Sunday
   • Catch problems early

4. Be Flexible:
   • Budget is a guide, not a cage
   • Adjust categories as needed

5. Partner Buy-In:
   • Both partners involved
   • Regular money meetings
   • Shared goals

6. Celebrate Wins:
   • Reached savings goal? Celebrate!
   • Paid off debt? Party!
   • Under budget? Treat yourself (small!)

📱 BUDGETING TOOLS:

Free:
   • Google Sheets
   • Mint app
   • EveryDollar (basic)

Paid:
   • YNAB ($99/year)
   • Monarch ($100/year)
   • EveryDollar Plus ($18/month)

Old School:
   • Pen and paper
   • Cash envelopes
   • Check register

🎯 90-DAY BUDGET MASTERY PLAN:

Month 1: FOUNDATION
   Week 1: Choose budget method
   Week 2: Track all expenses
   Week 3: Create first budget
   Week 4: Follow budget, adjust as needed

Month 2: OPTIMIZATION
   Week 1-4: Continue tracking
   Identify spending leaks
   Find $200-500 to cut
   Increase savings rate

Month 3: MASTERY
   Week 1-4: Budget becomes habit
   Spending naturally decreases
   Savings automatically increase
   Financial stress reduces

Result After 3 Months:
   • Know exactly where money goes
   • Spending down 10-20%
   • Savings up $500-1000/month
   • Debt decreasing
   • Financial confidence HIGH!

🔥 BUDGET CHALLENGES:

30-Day Budget Challenge:
   □ Track every expense
   □ Stay within budget
   □ No credit card use
   □ Pack lunch daily
   □ No dining out
   □ Prize: $500+ saved!

No-Spend Month:
   □ Only essentials (groceries, gas, bills)
   □ No shopping, dining out, entertainment
   □ Free activities only
   □ Save 30-40% of income!

Aggressive Savings Month:
   □ Cut expenses to minimum
   □ Side hustle every evening
   □ Sell unused items
   □ Goal: $1000+ saved!

💰 THE BUDGETING TRUTH:

Budget isn't about restriction.
Budget is about FREEDOM.

Freedom to:
   ✅ Spend guilt-free (within limits)
   ✅ Save for dreams
   ✅ Pay off debt
   ✅ Build wealth
   ✅ Live with intention

A budget is telling your money where to go,
instead of wondering where it went.

🎯 START TODAY:

1. Choose a budget method (50/30/20 if unsure)
2. Track expenses for 7 days
3. Create your first budget
4. Adjust and keep going!

Your financial freedom starts with your first budget! 💰"""

@message_protocol.on_message(model=Message)
async def handle_message(ctx: Context, sender: str, msg: Message):
    """Handle incoming budget/savings query"""
    ctx.logger.info(f"📨 Received budget query from {sender[:20]}...")
    ctx.logger.info(f"📝 Query: {msg.message}")

    # Process the budget/savings query
    response = analyze_budget_query(msg.message)

    # Send response back to TEELA
    await ctx.send(sender, Message(message=response))
    ctx.logger.info(f"✅ Sent budget advice ({len(response)} chars)")

# Include protocol
agent.include(message_protocol)

if __name__ == "__main__":
    print(f"🚀 Budget & Savings Expert Ready!\n")
    agent.run()
