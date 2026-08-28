import re
import json
from typing import Dict, Any, Optional
from ai_engine.forecasting import financial


def handle_purchase_impact_intent(
    prompt: str,
    p_lower: str,
    user_info: Dict[str, Any],
    t_data: Dict[str, Any],
    goal_name: str,
    goal_target: float,
    goal_current: float,
    think_mode: bool = False
) -> Optional[Dict[str, Any]]:
    price_match = re.search(r"[$]\s*([0-9][0-9,.]*)|([0-9][0-9,.]*)\s*(?:dollars?|usd)\b", prompt, re.IGNORECASE)
    purchase_keywords = ["buy", "purchase", "spend", "cost", "afford", "get a ", "buying", "invest in a "]
    is_purchase_query = any(k in p_lower for k in purchase_keywords) and price_match is not None

    if not is_purchase_query:
        return None

    val_raw = price_match.group(1) if price_match.group(1) else (price_match.group(2) or "1200")
    raw_amount_str = val_raw.replace(",", "")
    try:
        purchase_cost = float(raw_amount_str)
    except ValueError:
        purchase_cost = 1200.0

    clean_item_str = re.sub(r"[$]\s*[0-9][0-9,.]*|[0-9][0-9,.]*\s*(?:dollars?|usd)\b", "", prompt, flags=re.IGNORECASE)
    item_match = re.search(r"(?:buy|purchase|buying|spend on|get|afford)\s+(?:a|an|the)?\s*([a-zA-Z0-9\s\-]+?)(?:\s+today|\s+now|\s+this|\s*\?|\s*\,|\s*\.|\s+how|\s+will|\s+if|\s+for|\s+afford|$)", clean_item_str, re.IGNORECASE)
    item_name = item_match.group(1).strip() if item_match and len(item_match.group(1).strip()) > 1 else "Item"
    if len(item_name) > 30:
        item_name = "Major Purchase"

    monthly_savings = t_data["monthly_savings"]
    current_net_worth = t_data["net_worth"]

    new_progress = max(0.0, goal_current - purchase_cost)
    old_gap = max(0.0, goal_target - goal_current)
    new_gap = max(0.0, goal_target - new_progress)
    
    old_time_months = round(old_gap / monthly_savings, 1) if monthly_savings > 0 else 0
    new_time_months = round(new_gap / monthly_savings, 1) if monthly_savings > 0 else 0
    delay_months = round(new_time_months - old_time_months, 1)
    delay_days = int(delay_months * 30.4)

    annual_rate = 0.08
    compounded_5y = purchase_cost * ((1.0 + annual_rate) ** 5)
    foregone_growth = compounded_5y - purchase_cost

    mc_before = financial.run_monte_carlo_simulation(
        current_age=user_info.get("age", 25),
        retirement_age=user_info.get("retirement_goal_age", 60),
        current_net_worth=current_net_worth,
        monthly_savings=monthly_savings,
        num_simulations=300
    )
    hits_before = sum(1 for v in mc_before["final_values"] if v >= user_info.get("target_net_worth", 1000000.0))
    prob_before = round((hits_before / len(mc_before["final_values"])) * 100) if mc_before["final_values"] else 75

    mc_after = financial.run_monte_carlo_simulation(
        current_age=user_info.get("age", 25),
        retirement_age=user_info.get("retirement_goal_age", 60),
        current_net_worth=max(0.0, current_net_worth - purchase_cost),
        monthly_savings=monthly_savings,
        num_simulations=300
    )
    hits_after = sum(1 for v in mc_after["final_values"] if v >= user_info.get("target_net_worth", 1000000.0))
    prob_after = round((hits_after / len(mc_after["final_values"])) * 100) if mc_after["final_values"] else 75

    advice_text = f"""### Visual Risk Impact Analysis: {item_name.title()} (${purchase_cost:,.2f})

Purchasing this **{item_name}** for **${purchase_cost:,.2f}** will directly impact your **{goal_name}** and 5-year capital compounding. Here is the exact simulation breakdown:

#### 1. **Goal Milestone & Timeline Delay**
- **Current Progress:** ${goal_current:,.2f} / ${goal_target:,.2f} ({round((goal_current/goal_target)*100) if goal_target > 0 else 100}% complete)
- **Post-Purchase Progress:** ${new_progress:,.2f} / ${goal_target:,.2f} ({round((new_progress/goal_target)*100) if goal_target > 0 else 100}% complete)
- **Timeline Impact:** Reaching your {goal_name} target will be delayed by **~{delay_months} months (~{delay_days} days)** at your current savings pace of **${monthly_savings:,.2f}/month**.

#### 2. **5-Year Compounding Opportunity Cost**
- If kept invested at an 8% annual return, ${purchase_cost:,.2f} would grow into **${compounded_5y:,.2f}** over 5 years (**+${foregone_growth:,.2f} in foregone investment returns**).

#### 3. **Long-Term Retirement Probability**
- **Baseline Monte Carlo Success Odds:** **{prob_before}%**
- **Adjusted Odds:** **{prob_after}%** ({prob_after - prob_before:+d}% variance)

> **Risk Verdict:** If this {item_name} enhances your daily productivity or health, the {delay_months}-month delay is manageable. To neutralize the delay, consider increasing monthly savings by **+${round(purchase_cost / 6, 2):,.2f}/mo** for the next 6 months."""

    if think_mode:
        think_block = f"""<think>
Step 1 — Goal Definition:
• Objective: Evaluate capital friction and milestone delay of purchasing "{item_name}" (${purchase_cost:,.2f}).

Step 2 — Telemetry Search & Gathered User Data:
• Baseline Telemetry: Net Worth = ${current_net_worth:,.2f} | Monthly Savings Surplus = ${monthly_savings:,.2f}/mo
• Active Milestone Goal: "{goal_name}" (Current: ${goal_current:,.2f} / Target: ${goal_target:,.2f})
• Post-Purchase Remaining Progress: ${new_progress:,.2f} / ${goal_target:,.2f}

Step 3 — Multi-Criteria Analysis & Optimization:
• Milestone Timeline Impact: Target delayed by +{delay_months} months (~{delay_days} days).
• 5-Year Compounding Opportunity Cost: ${purchase_cost:,.2f} @ 8% CAGR -> ${compounded_5y:,.2f} (+${foregone_growth:,.2f} foregone gain).
• Stochastic Monte Carlo: Baseline odds = {prob_before}%, Post-purchase odds = {prob_after}% ({prob_after - prob_before:+d}% shift).

Step 4 — Formulated Strategic Execution Plan:
• Formatted decision matrix and generated interactive purchase impact logging card.
</think>

"""
        advice_text = think_block + advice_text

    action_payload = {
        "item_name": item_name.title(),
        "cost": purchase_cost,
        "goal_name": goal_name,
        "goal_target": goal_target,
        "goal_current": goal_current,
        "new_progress": new_progress,
        "delay_months": delay_months,
        "delay_days": delay_days,
        "compounded_5y": round(compounded_5y, 2),
        "foregone_growth": round(foregone_growth, 2),
        "prob_before": prob_before,
        "prob_after": prob_after,
        "monthly_savings": monthly_savings
    }

    return {
        "content": advice_text,
        "action_type": "purchase_impact",
        "action_payload": json.dumps(action_payload),
        "action_status": "proposed"
    }
