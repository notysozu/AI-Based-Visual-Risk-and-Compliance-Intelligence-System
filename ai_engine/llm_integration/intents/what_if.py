import re
import json
from typing import Dict, Any, Optional
from ai_engine.forecasting import financial, habits
from ai_engine.llm_integration.generators import generate_digital_twin_advice


def handle_what_if_intent(
    prompt: str,
    p_lower: str,
    user_id: Any,
    user_info: Dict[str, Any],
    baseline: Dict[str, Any],
    think_mode: bool = False
) -> Optional[Dict[str, Any]]:
    what_if_keywords = ["what if", "simulate", "if i sleep", "if i study", "cut sleep", "more savings", "less sleep", "scenario", "sleep less", "study more"]
    is_what_if = any(k in p_lower for k in what_if_keywords)

    if not is_what_if:
        return None

    sleep_delta = 0.0
    study_delta = 0.0
    savings_delta = 0.0

    sleep_m = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*(?:hours?|hrs?)\s*(?:of\s*)?sleep", p_lower)
    if sleep_m:
        target_sleep = float(sleep_m.group(1))
        sleep_delta = target_sleep - float(baseline.get("sleep_hours", 7.5))
    elif "cut sleep" in p_lower or "less sleep" in p_lower:
        sleep_delta = -1.0
    elif "more sleep" in p_lower:
        sleep_delta = +1.0

    study_m = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*(?:hours?|hrs?)\s*(?:of\s*)?(?:study|learning|work)", p_lower)
    if study_m:
        target_study = float(study_m.group(1))
        study_delta = target_study - float(baseline.get("study_hours_week", 10.0))
    elif "more study" in p_lower or "study more" in p_lower:
        study_delta = +5.0

    sav_m = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*(?:dollars?|\$)\s*(?:more\s*)?savings?", p_lower)
    if sav_m:
        savings_delta = float(sav_m.group(1))
    elif "save more" in p_lower or "increase savings" in p_lower:
        savings_delta = +300.0

    if sleep_delta == 0.0 and study_delta == 0.0 and savings_delta == 0.0:
        sleep_delta = -0.5
        study_delta = +4.0
        savings_delta = +250.0

    # Calculate Scenario A (Baseline)
    mod_savings_a = float(baseline.get("monthly_savings", 1000.0))
    mod_sleep_a = float(baseline.get("sleep_hours", 7.5))
    mod_study_week_a = float(baseline.get("study_hours_week", 10.0))
    mod_study_daily_a = mod_study_week_a / 7.0

    preds_a = habits.predict_scenario_scores(
        coefs={},
        sleep_hours=mod_sleep_a,
        exercise_hours=float(baseline.get("exercise_hours", 0.5)),
        screen_hours=float(baseline.get("screen_hours", 3.5)),
        social_hours=float(baseline.get("social_hours", 1.0)),
        study_hours=mod_study_daily_a
    )

    age = int(user_info.get("age", 25) or 25)
    retire_age = int(user_info.get("retirement_goal_age", 60) or 60)
    net_worth = float(baseline.get("current_net_worth", 15000.0) or 15000.0)
    target_net_worth = float(user_info.get("target_net_worth", 1000000.0) or 1000000.0)

    fin_proj_a = financial.run_deterministic_projection(
        current_age=age,
        retirement_age=age + 5,
        current_net_worth=net_worth,
        monthly_savings=mod_savings_a,
        annual_return_rate=0.08,
        annual_inflation_rate=0.025
    )

    # Calculate Scenario B (Tweaked)
    mod_savings_b = max(0.0, mod_savings_a + savings_delta)
    mod_sleep_b = max(4.0, min(12.0, mod_sleep_a + sleep_delta))
    mod_study_week_b = max(0.0, mod_study_week_a + study_delta)
    mod_study_daily_b = mod_study_week_b / 7.0

    preds_b = habits.predict_scenario_scores(
        coefs={},
        sleep_hours=mod_sleep_b,
        exercise_hours=float(baseline.get("exercise_hours", 0.5)),
        screen_hours=float(baseline.get("screen_hours", 3.5)),
        social_hours=float(baseline.get("social_hours", 1.0)),
        study_hours=mod_study_daily_b
    )

    fin_proj_b = financial.run_deterministic_projection(
        current_age=age,
        retirement_age=age + 5,
        current_net_worth=net_worth,
        monthly_savings=mod_savings_b,
        annual_return_rate=0.08,
        annual_inflation_rate=0.025
    )

    retirement_proj_b = financial.run_deterministic_projection(
        current_age=age,
        retirement_age=retire_age,
        current_net_worth=net_worth,
        monthly_savings=mod_savings_b,
        annual_return_rate=0.08,
        annual_inflation_rate=0.025
    )
    final_retirement_wealth = retirement_proj_b[-1]["net_worth"]
    attained_retirement = final_retirement_wealth >= target_net_worth

    sim_results = {
        "scenario_a": {
            "scenario_name": "Scenario A",
            "datapoints": fin_proj_a,
            "attained_retirement": True,
            "wealth_at_end": fin_proj_a[-1]["net_worth"],
            "retirement_wealth": fin_proj_a[-1]["net_worth"],
            "health_index": preds_a["health_index"],
            "focus_index": preds_a["focus_index"],
            "details": {
                "sleep": mod_sleep_a,
                "study_week": mod_study_week_a,
                "monthly_savings": mod_savings_a
            }
        },
        "scenario_b": {
            "scenario_name": "Scenario B",
            "datapoints": fin_proj_b,
            "attained_retirement": attained_retirement,
            "wealth_at_end": fin_proj_b[-1]["net_worth"],
            "retirement_wealth": final_retirement_wealth,
            "health_index": preds_b["health_index"],
            "focus_index": preds_b["focus_index"],
            "details": {
                "sleep": mod_sleep_b,
                "study_week": mod_study_week_b,
                "monthly_savings": mod_savings_b
            }
        }
    }

    sb = sim_results["scenario_b"]
    sa = sim_results["scenario_a"]
    advice_text = generate_digital_twin_advice(user_info, baseline, sim_results)

    if think_mode:
        think_block = f"""<think>
Step 1 — Goal Definition:
• Objective: Run What-If sandbox simulation testing parameter shifts (Savings: ${savings_delta:+,.2f}/mo, Sleep: {sleep_delta:+.1f}h/day, Study: {study_delta:+.1f}h/week).

Step 2 — Telemetry Search & Gathered User Data:
• Baseline Telemetry: Sleep = {sa['details']['sleep']:.1f}h | Study = {sa['details']['study_week']:.1f}h/wk | Savings = ${sa['details']['monthly_savings']:,.2f}/mo
• Proposed Shifts: Sleep -> {sb['details']['sleep']:.1f}h | Study -> {sb['details']['study_week']:.1f}h/wk | Savings -> ${sb['details']['monthly_savings']:,.2f}/mo

Step 3 — Multi-Criteria Analysis & Optimization:
• Telemetry Elasticity Fit: Health Index {sa['health_index']:.1f} -> {sb['health_index']:.1f} ({sb['health_index'] - sa['health_index']:+.1f}) | Focus Rating {sa['focus_index']:.1f} -> {sb['focus_index']:.1f} ({sb['focus_index'] - sa['focus_index']:+.1f}).
• 5-Year Capital Compounding: 5-Year Net Worth shift = ${sb['wealth_at_end'] - sa['wealth_at_end']:+,.2f}.
• Retirement Attainment: {'Attained on track' if sb['attained_retirement'] else 'Requires adjustment'}.

Step 4 — Formulated Strategic Execution Plan:
• Formatted simulation breakdown and prepared What-If preset application card.
</think>

"""
        advice_text = think_block + advice_text

    action_payload = {
        "savings_delta": savings_delta,
        "sleep_delta": sleep_delta,
        "study_delta": study_delta,
        "proposed_sleep": round(sb["details"]["sleep"], 1),
        "proposed_study": round(sb["details"]["study_week"], 1),
        "proposed_savings": round(sb["details"]["monthly_savings"], 2),
        "baseline_health": round(sa["health_index"], 1),
        "proposed_health": round(sb["health_index"], 1),
        "baseline_focus": round(sa["focus_index"], 1),
        "proposed_focus": round(sb["focus_index"], 1),
        "wealth_5y_diff": round(sb["wealth_at_end"] - sa["wealth_at_end"], 2),
        "attained_retirement": sb["attained_retirement"]
    }

    return {
        "content": advice_text,
        "action_type": "simulate_what_if",
        "action_payload": json.dumps(action_payload),
        "action_status": "proposed"
    }
