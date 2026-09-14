"""
GoalAgent — handles goal name and target mutations from natural language chat.

Triggers on: "change my goal to X", "set goal to X", "I want to save for X",
             "my goal is X", "update goal to X", "new goal: X"
"""

import re
import json
from typing import Dict, Any, Optional


# Well-known item price estimates (used when user names a product without a price)
KNOWN_ITEM_PRICES: Dict[str, float] = {
    "macbook pro": 2500.0,
    "macbook air": 1200.0,
    "macbook": 1500.0,
    "iphone": 999.0,
    "iphone pro": 1199.0,
    "ipad": 599.0,
    "ipad pro": 1099.0,
    "ps5": 499.0,
    "playstation 5": 499.0,
    "xbox": 499.0,
    "tesla": 45000.0,
    "car": 25000.0,
    "house": 300000.0,
    "laptop": 1200.0,
    "gaming pc": 1500.0,
    "emergency fund": 50000.0,
    "vacation": 3000.0,
    "holiday": 3000.0,
    "wedding": 20000.0,
    "college": 40000.0,
    "university": 40000.0,
}


def _estimate_price(goal_name: str) -> Optional[float]:
    """Try to find a known price estimate for a named item."""
    name_lower = goal_name.lower().strip()
    for item, price in KNOWN_ITEM_PRICES.items():
        if item in name_lower:
            return price
    return None


def handle_goal_agent(
    prompt: str,
    p_lower: str,
    user_info: Dict[str, Any],
    t_data: Dict[str, Any],
    think_mode: bool = False
) -> Optional[Dict[str, Any]]:
    """
    Detect goal change intent and return a direct-execution action payload.
    Returns None if this message is not a goal mutation request.
    """
    # Trigger patterns
    goal_triggers = [
        r"(?:change|update|set|switch)\s+my\s+goal\s+to\s+(.+)",
        r"(?:change|update|set|switch)\s+(?:the\s+)?goal\s+to\s+(.+)",
        r"my\s+(?:new\s+)?goal\s+(?:is|should be|will be)\s+(.+)",
        r"i\s+want\s+to\s+(?:save\s+for|buy|get|purchase)\s+(?:a\s+|an\s+)?(.+)",
        r"(?:new|primary)\s+goal[:\s]+(.+)",
        r"goal[:\s]+(.+)",
        r"saving\s+(?:up\s+)?for\s+(?:a\s+|an\s+)?(.+)",
    ]

    goal_name = None
    goal_target = None

    for pattern in goal_triggers:
        m = re.search(pattern, p_lower)
        if m:
            raw = m.group(1).strip()
            # Strip trailing punctuation / filler
            raw = re.sub(r"[.,!?]+$", "", raw).strip()
            raw = re.sub(r"\s+(?:please|now|asap|immediately|today)$", "", raw, flags=re.IGNORECASE).strip()

            # Extract dollar amount if mentioned
            price_m = re.search(r"\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:k|thousand)?", raw)
            if price_m:
                val_str = price_m.group(1).replace(",", "")
                multiplier = 1000.0 if "k" in raw[price_m.end():price_m.end()+2].lower() else 1.0
                goal_target = float(val_str) * multiplier
                # Remove price from name
                raw = raw[:price_m.start()].strip() + raw[price_m.end():].strip()
                raw = re.sub(r"\s+", " ", raw).strip()

            if raw:
                goal_name = raw.title()
                break

    if not goal_name:
        return None

    # Estimate price for known items if not provided
    if goal_target is None:
        goal_target = _estimate_price(goal_name)

    # Build response
    current_goal = user_info.get("goal_name", "Emergency Fund")
    current_goal_target = float(user_info.get("goal_target", 50000.0) or 50000.0)
    current_goal_current = float(t_data.get("net_worth", 0.0) * 0.4)

    payload: Dict[str, Any] = {"goal_name": goal_name}
    if goal_target is not None:
        payload["goal_target"] = goal_target

    price_str = f" (\\${goal_target:,.0f} target)" if goal_target else ""
    prev_str = f"**{current_goal}**" if current_goal else "your previous goal"

    think_prefix = ""
    if think_mode:
        think_prefix = f"""<think>
Step 1 — Goal Definition:
• Objective: Update user's primary financial goal from chat input.

Step 2 — Telemetry Search & Gathered User Data:
• Previous Goal: {current_goal} (${current_goal_target:,.0f} target, ${current_goal_current:,.0f} current)
• Detected New Goal Name: {goal_name}
• Detected New Target: {"$" + f"{goal_target:,.0f}" if goal_target else "Not specified — using estimate or preserving"}

Step 3 — Multi-Criteria Analysis & Optimization:
• Goal name parsed successfully. Price estimation applied if target not explicitly stated.

Step 4 — Formulated Strategic Execution Plan:
• Executing goal update directly to MongoDB. No approval step required.
</think>

"""

    content = f"""{think_prefix}### ✓ Goal Updated

Your primary financial target has been changed from {prev_str} to **{goal_name}**{price_str}.

| Field | Previous | New |
| :--- | :--- | :--- |
| **Goal Name** | {current_goal} | **{goal_name}** |
| **Target Amount** | ${current_goal_target:,.0f} | **{"$" + f"{goal_target:,.0f}" if goal_target else "Unchanged"}** |

Your existing savings progress has been preserved. To track your new goal, check the **Financial Dashboard**.
"""

    return {
        "content": content,
        "action_type": "update_goal",
        "action_payload": json.dumps(payload),
        "action_status": "auto_execute",
    }
