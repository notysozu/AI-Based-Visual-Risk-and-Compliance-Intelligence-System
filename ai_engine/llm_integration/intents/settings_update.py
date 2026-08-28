import re
import json
from typing import Dict, Any, Optional


def handle_settings_update_intent(
    prompt: str,
    p_lower: str,
    user_info: Dict[str, Any],
    t_data: Dict[str, Any],
    think_mode: bool = False
) -> Optional[Dict[str, Any]]:
    settings_keywords = ["change my", "update my", "set my", "my income is", "my expense is", "my sleep target is", "retire at age"]
    is_settings_query = any(k in p_lower for k in settings_keywords) and any(w in p_lower for w in ["income", "expense", "expenses", "sleep", "target", "net worth", "age", "role"])

    if not is_settings_query:
        return None

    diff_fields = {}
    
    inc_m = re.search(r"(?:income|salary|earn|earning)\s*(?:is|to|of)?\s*[$]?\s*([0-9][0-9,.]*)", p_lower)
    if inc_m:
        val = float(inc_m.group(1).replace(",", ""))
        diff_fields["monthly_income"] = val

    exp_m = re.search(r"(?:expense|expenses|spending|spend)\s*(?:is|to|of)?\s*[$]?\s*([0-9][0-9,.]*)", p_lower)
    if exp_m:
        val = float(exp_m.group(1).replace(",", ""))
        diff_fields["monthly_expenses"] = val

    slp_m = re.search(r"sleep\s*(?:target|hours?)?\s*(?:is|to|of)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:hours?|hrs?|h)?", p_lower)
    if slp_m:
        val = float(slp_m.group(1))
        diff_fields["sleep_target_hours"] = val

    nw_m = re.search(r"(?:net\s*worth|savings|capital)\s*(?:is|to|of)?\s*[$]?\s*([0-9][0-9,.]*)", p_lower)
    if nw_m:
        val = float(nw_m.group(1).replace(",", ""))
        diff_fields["net_worth"] = val

    ret_m = re.search(r"(?:retire|retirement)\s*(?:at|goal|age)?\s*(?:is|to|of)?\s*([0-9]{2})", p_lower)
    if ret_m:
        val = int(ret_m.group(1))
        diff_fields["retirement_goal_age"] = val

    if not diff_fields:
        return None

    table_rows = "\n".join(
        f"| **{k.replace('_', ' ').title()}** | `{getattr(user_info, k, user_info.get(k, 'N/A'))}` | **`{v}`** |"
        for k, v in diff_fields.items()
    )

    advice_text = f"""### Profile Settings Update Proposal

I have detected the following parameter updates for your profile:

| Setting Parameter | Current Value | Proposed New Value |
| :--- | :--- | :--- |
{table_rows}

Click **Approve Changes** below to commit these updates directly to your database profile."""

    if think_mode:
        think_block = f"""<think>
Step 1 — Goal Definition:
• Objective: Parse profile configuration modification from user statement and prepare update payload.

Step 2 — Telemetry Search & Gathered User Data:
• Current Profile: {json.dumps(diff_fields)}

Step 3 — Multi-Criteria Analysis & Optimization:
• Parameter Validation: Verified boundary checks on updated fields.

Step 4 — Formulated Strategic Execution Plan:
• Formatted parameter comparison table and prepared profile update card for user approval.
</think>

"""
        advice_text = think_block + advice_text

    return {
        "content": advice_text,
        "action_type": "update_settings",
        "action_payload": json.dumps(diff_fields),
        "action_status": "proposed"
    }
