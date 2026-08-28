import re
import json
from typing import Dict, Any, Optional
from ai_engine.simulation import simulator
from database.database import SessionLocal
from ai_engine.llm_integration.generators import generate_digital_twin_advice


def handle_what_if_intent(
    prompt: str,
    p_lower: str,
    user_id: int,
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

    with SessionLocal() as db_session:
        sim_results = simulator.run_what_if_comparison(
            db=db_session,
            user_id=user_id,
            change_a={"monthly_investment_change": 0.0, "sleep_hours_change": 0.0, "weekly_study_change": 0.0},
            change_b={"monthly_investment_change": savings_delta, "sleep_hours_change": sleep_delta, "weekly_study_change": study_delta}
        )

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
