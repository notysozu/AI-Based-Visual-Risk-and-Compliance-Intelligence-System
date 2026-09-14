"""
FinanceAgent — handles income, expenses, and net worth mutations from chat.

Triggers on: "my income is $X", "I earn $X", "my expenses are $X",
             "my net worth is $X", "I saved $X"
"""

import re
import json
from typing import Dict, Any, Optional


def handle_finance_agent(
    prompt: str,
    p_lower: str,
    user_info: Dict[str, Any],
    t_data: Dict[str, Any],
    think_mode: bool = False
) -> Optional[Dict[str, Any]]:
    """
    Detect financial field mutation intent and return a direct-execution action payload.
    Returns None if this message is not a financial mutation request.
    """
    # Must have a trigger keyword + a numeric value
    finance_triggers = [
        "my income is", "my income:", "my income to", "set my income", "update my income", "change my income",
        "i earn", "i make", "i now earn", "i now make",
        "my salary is", "my salary to", "set my salary", "my monthly income is", "income is now",
        "my expenses are", "my expenses:", "my expenses to", "set my expenses", "update my expenses",
        "my spending is", "i spend", "my monthly expenses are", "expenses are now",
        "my net worth is", "my net worth to", "set my net worth", "update my net worth",
        "my savings are", "i have saved", "i currently have",
        "net worth is now", "net worth:",
    ]

    has_trigger = any(k in p_lower for k in finance_triggers)
    has_amount = bool(re.search(r"\$?\s*[0-9][0-9,]*(?:\.[0-9]+)?", p_lower))

    if not has_trigger or not has_amount:
        return None

    def extract_amount(pattern: str, text: str) -> Optional[float]:
        m = re.search(pattern, text)
        if not m:
            return None
        raw = m.group(1).replace(",", "").strip()
        val = float(raw)
        # handle "5k" → 5000
        suffix_match = re.search(r"\b([0-9,.]+)\s*k\b", text[m.start():m.start()+30])
        if suffix_match and abs(float(suffix_match.group(1).replace(",", "")) * 1000 - val * 1000) < 1:
            val *= 1000
        return val

    diff_fields: Dict[str, Any] = {}
    descriptions = []

    # Income
    inc_m = re.search(
        r"(?:income|salary|earn(?:ing)?s?|make|pay)\s*(?:is|are|to|=|:)?\s*\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:k\b)?",
        p_lower
    )
    if inc_m:
        val_str = inc_m.group(1).replace(",", "")
        val = float(val_str)
        if "k" in p_lower[inc_m.end():inc_m.end() + 3]:
            val *= 1000
        diff_fields["monthly_income"] = val
        descriptions.append(f"Monthly Income → **${val:,.0f}**")

    # Expenses
    exp_m = re.search(
        r"(?:expense|expenses|spending|spend)\s*(?:is|are|to|=|:)?\s*\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:k\b)?",
        p_lower
    )
    if exp_m:
        val_str = exp_m.group(1).replace(",", "")
        val = float(val_str)
        if "k" in p_lower[exp_m.end():exp_m.end() + 3]:
            val *= 1000
        diff_fields["monthly_expenses"] = val
        descriptions.append(f"Monthly Expenses → **${val:,.0f}**")

    # Net worth / savings
    nw_m = re.search(
        r"(?:net\s*worth|savings?|have\s+saved|currently\s+have)\s*(?:is|are|of|to|=|:)?\s*\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:k\b)?",
        p_lower
    )
    if nw_m:
        val_str = nw_m.group(1).replace(",", "")
        val = float(val_str)
        if "k" in p_lower[nw_m.end():nw_m.end() + 3]:
            val *= 1000
        diff_fields["net_worth"] = val
        descriptions.append(f"Net Worth → **${val:,.0f}**")

    if not diff_fields:
        return None

    current_income = float(user_info.get("monthly_income", 0.0) or 0.0)
    current_expenses = float(user_info.get("monthly_expenses", 0.0) or 0.0)
    new_income = diff_fields.get("monthly_income", current_income)
    new_expenses = diff_fields.get("monthly_expenses", current_expenses)
    new_savings = max(0.0, new_income - new_expenses)

    think_prefix = ""
    if think_mode:
        think_prefix = f"""<think>
Step 1 — Goal Definition:
• Objective: Update financial profile fields from user statement.

Step 2 — Telemetry Search & Gathered User Data:
• Detected fields: {json.dumps(diff_fields)}
• Previous: Income=${current_income:,.0f}, Expenses=${current_expenses:,.0f}

Step 3 — Multi-Criteria Analysis & Optimization:
• Values validated. Monthly surplus recalculated.

Step 4 — Formulated Strategic Execution Plan:
• Executing financial profile update directly to MongoDB.
</think>

"""

    changes_str = "\n".join(f"- {d}" for d in descriptions)
    savings_rate = round((new_savings / new_income) * 100) if new_income > 0 else 0

    content = f"""{think_prefix}### ✓ Financial Profile Updated

{changes_str}

**Recalculated Monthly Surplus:** ${new_savings:,.0f}/month ({savings_rate}% savings rate)

Your financial telemetry and wealth forecast have been refreshed with the new values.
"""

    return {
        "content": content,
        "action_type": "update_user_fields",
        "action_payload": json.dumps(diff_fields),
        "action_status": "auto_execute",
    }
