"""
Router Agent — the main orchestrator for the multi-agent chat mutation system.

Inspects each user message and dispatches to the appropriate specialized sub-agent.
Priority order (highest to lowest):
  1. GoalAgent       — "change my goal to X"
  2. FinanceAgent    — "my income is $X"
  3. SettingsAgent   — "set my sleep target to X"
  4. PlannerAgent    — "add a task: X at Y"
  5. StudyAgent      — "I studied X hours of math"
  6. HabitAgent      — "I slept 6 hours"

Returns None to fall through to the existing intent dispatch chain.
"""

from typing import Dict, Any, Optional

from .goal_agent import handle_goal_agent
from .finance_agent import handle_finance_agent
from .settings_agent import handle_settings_agent
from .planner_agent import handle_planner_agent
from .study_agent import handle_study_agent
from .habit_agent import handle_habit_agent


def route_to_agents(
    prompt: str,
    p_lower: str,
    user_info: Dict[str, Any],
    t_data: Dict[str, Any],
    think_mode: bool = False,
) -> Optional[Dict[str, Any]]:
    """
    Try each specialized agent in priority order.
    Returns the first non-None result, or None if no agent claims the message.

    All returned results have action_status="auto_execute" which causes
    _maybe_auto_execute_chat_action in chat.py to execute them immediately
    without requiring user confirmation.
    """
    agents = [
        ("GoalAgent",     handle_goal_agent),
        ("FinanceAgent",  handle_finance_agent),
        ("SettingsAgent", handle_settings_agent),
        ("PlannerAgent",  handle_planner_agent),
        ("StudyAgent",    handle_study_agent),
        ("HabitAgent",    handle_habit_agent),
    ]

    for agent_name, handler in agents:
        try:
            result = handler(prompt, p_lower, user_info, t_data, think_mode)
            if result is not None:
                # Tag which agent handled this (for debugging / logging)
                result["_agent"] = agent_name
                return result
        except Exception as e:
            # Never let a broken agent crash the main chat pipeline
            print(f"[Router] {agent_name} raised an exception: {e}")
            continue

    return None
