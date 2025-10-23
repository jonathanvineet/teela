"""
Standalone logic for FinancialAdvisor so the lab simulator can call it without uagents dependency.
"""

def analyze_spending(spending_data):
    # Simple category summary and advice heuristic
    categories = {}
    for item in spending_data:
        cat = item.get("category", "other")
        try:
            amt = float(item.get("amount", 0))
        except Exception:
            amt = 0.0
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
