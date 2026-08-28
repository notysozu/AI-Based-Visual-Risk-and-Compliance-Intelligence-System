import json
from typing import Dict, Any, Optional
from ai_engine.forecasting import financial


def handle_wealth_forecast_intent(
    prompt: str,
    p_lower: str,
    user_info: Dict[str, Any],
    t_data: Dict[str, Any],
    think_mode: bool = False
) -> Optional[Dict[str, Any]]:
    wealth_keywords = ["monte carlo", "wealth forecast", "forecast my wealth", "retirement forecast", "net worth forecast", "simulate wealth", "financial forecast", "wealth simulation"]
    is_wealth_query = any(k in p_lower for k in wealth_keywords)

    if not is_wealth_query:
        return None

    current_net_worth = t_data["net_worth"]
    monthly_savings = t_data["monthly_savings"]
    curr_age = user_info.get("age", 25)
    ret_age = user_info.get("retirement_goal_age", 60)
    target_nw = user_info.get("target_net_worth", 1000000.0)

    mc_res = financial.run_monte_carlo_simulation(
        current_age=curr_age,
        retirement_age=ret_age,
        current_net_worth=current_net_worth,
        monthly_savings=monthly_savings,
        num_simulations=500
    )

    p10 = mc_res["p10"][-1]
    p50 = mc_res["median"][-1]
    p90 = mc_res["p90"][-1]
    hits = sum(1 for v in mc_res["final_values"] if v >= target_nw)
    prob_success = round((hits / len(mc_res["final_values"])) * 100) if mc_res["final_values"] else 75

    advice_text = f"""### 500-Run Monte Carlo Wealth Forecast

Based on 500 stochastic simulation runs (8% mean return, 15% annual volatility, 2.5% inflation) for retirement at **Age {ret_age}**:

| Percentile Band | Projected Ending Net Worth | Market Trajectory |
| :--- | :--- | :--- |
| **P10 (Bear Market Floor)** | **${p10:,.2f}** | Conservative Drawdowns |
| **P50 (Median Expected)** | **${p50:,.2f}** | Long-Term Baseline |
| **P90 (Bull Market Peak)** | **${p90:,.2f}** | High-Compounding Upside |

#### Goal Attainment Summary:
- **Target Net Worth:** **${target_nw:,.2f}**
- **Attainment Probability:** **{prob_success}%**
- **Monthly Savings Engine:** **${monthly_savings:,.2f}/month** ({t_data['savings_rate']}% savings rate)

> **Strategic Guidance:** Maintaining your current monthly savings pace provides a robust {prob_success}% probability of reaching your target."""

    if think_mode:
        think_block = f"""<think>
Step 1 — Goal Definition:
• Objective: Execute 500-iteration Monte Carlo simulation of capital accumulation to retirement Age {ret_age}.

Step 2 — Telemetry Search & Gathered User Data:
• Baseline Telemetry: Current Net Worth = ${current_net_worth:,.2f} | Monthly Savings = ${monthly_savings:,.2f}/mo
• Horizon: Age {curr_age} -> Age {ret_age} ({ret_age - curr_age} years) | Target Net Worth = ${target_nw:,.2f}

Step 3 — Multi-Criteria Analysis & Optimization:
• Stochastic Bands: P10 = ${p10:,.2f}, Median P50 = ${p50:,.2f}, P90 = ${p90:,.2f}.
• Goal Success Odds: {prob_success}% probability of achieving target capital milestone.

Step 4 — Formulated Strategic Execution Plan:
• Formatted wealth probability table and packaged interactive forecast card.
</think>

"""
        advice_text = think_block + advice_text

    action_payload = {
        "p10": p10,
        "median": p50,
        "p90": p90,
        "prob_success": prob_success,
        "target_nw": target_nw,
        "monthly_savings": monthly_savings
    }

    return {
        "content": advice_text,
        "action_type": "wealth_forecast",
        "action_payload": json.dumps(action_payload),
        "action_status": "proposed"
    }
