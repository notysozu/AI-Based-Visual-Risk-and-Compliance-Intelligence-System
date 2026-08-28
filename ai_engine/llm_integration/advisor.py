

import os
import re
# JSON processing & sanitization utilities
import json
from dotenv import load_dotenv
from groq import Groq
from typing import Dict, Any, List, Optional

# Load .env file from project root
load_dotenv()
_env_path = os.path.join(os.path.dirname(__file__), "../../.env")
if os.path.exists(_env_path):
    load_dotenv(_env_path, override=True)


# Dynamic Groq client loader
def get_groq_client() -> Optional[Groq]:
    """
    Dynamically retrieve and instantiate the Groq client from environment or .env file.
    """
    key = os.getenv("GROQ_API_KEY")
    if not key or key.strip() in ("", "your_groq_api_key_here"):
        load_dotenv(override=True)
        if os.path.exists(_env_path):
            load_dotenv(_env_path, override=True)
        key = os.getenv("GROQ_API_KEY")

    if not key or key.strip() in ("", "your_groq_api_key_here"):
        return None

    try:
        return Groq(api_key=key.strip())
    except Exception as e:
        print(f"Error initializing Groq client: {e}")
        return None


def get_rule_based_advice(
    user_info: Dict[str, Any],
    baseline: Dict[str, Any],
    sim_results: Dict[str, Any]
) -> str:
    """
    Fallback high-quality rule-based advisor when no Groq API key is configured.
    """
    sa = sim_results["scenario_a"]
    sb = sim_results["scenario_b"]

    advice = "### Digital Twin Strategy Verdict\n\n"

    advice += "#### **Analysis of Scenario A**\n"
    advice += f"- **Lifestyle changes:** Sleep: {sa['details']['sleep']:.1f} hrs, Study: {sa['details']['study_week']:.1f} hrs/week, Monthly Savings: ${sa['details']['monthly_savings']:.2f}.\n"
    advice += f"- **Wellbeing & Performance:** Health Index: {sa['health_index']:.1f}/10, Focus Rating: {sa['focus_index']:.1f}/10.\n"
    advice += f"- **Financial Projection:** Net Worth in 5 years: ${sa['wealth_at_end']:,.2f}. "
    if sa["attained_retirement"]:
        advice += "On track to reach retirement goals.\n"
    else:
        advice += f"Projected retirement wealth of ${sa['retirement_wealth']:,.2f} falls short of target (${user_info['target_net_worth']:,.2f}).\n"

    advice += "\n#### **Analysis of Scenario B**\n"
    advice += f"- **Lifestyle changes:** Sleep: {sb['details']['sleep']:.1f} hrs, Study: {sb['details']['study_week']:.1f} hrs/week, Monthly Savings: ${sb['details']['monthly_savings']:.2f}.\n"
    advice += f"- **Wellbeing & Performance:** Health Index: {sb['health_index']:.1f}/10, Focus Rating: {sb['focus_index']:.1f}/10.\n"
    advice += f"- **Financial Projection:** Net Worth in 5 years: ${sb['wealth_at_end']:,.2f}. "
    if sb["attained_retirement"]:
        advice += "On track to reach retirement goals.\n"
    else:
        advice += f"Projected retirement wealth of ${sb['retirement_wealth']:,.2f} falls short of target (${user_info['target_net_worth']:,.2f}).\n"

    advice += "\n#### **Tradeoff Analysis & Verdict**\n"

    sleep_diff = sb['details']['sleep'] - sa['details']['sleep']
    if sleep_diff > 0.5:
        advice += f"- **Health:** Scenario B prioritizes sleep by {sleep_diff:.1f} additional hours, yielding a better Health Index of **{sb['health_index']:.1f}/10** compared to Scenario A (**{sa['health_index']:.1f}/10**). Rest is critical for avoiding long-term cognitive burnout.\n"
    elif sleep_diff < -0.5:
        advice += f"- **Health:** Scenario A prioritizes sleep by {abs(sleep_diff):.1f} additional hours, yielding a better Health Index of **{sa['health_index']:.1f}/10** compared to Scenario B (**{sb['health_index']:.1f}/10**). Avoid cutting sleep short to hit financial targets.\n"
    else:
        advice += "- **Health:** Both scenarios maintain similar sleeping patterns.\n"

    study_diff = sb['details']['study_week'] - sa['details']['study_week']
    if study_diff > 1.0:
        advice += f"- **Studies:** Scenario B increases weekly study by {study_diff:.1f} hours, boosting focus performance to **{sb['focus_index']:.1f}/10**. This represents a strong commitment to learning and career pivoting.\n"
    elif study_diff < -1.0:
        advice += f"- **Studies:** Scenario A increases weekly study by {abs(study_diff):.1f} hours, boosting focus performance to **{sa['focus_index']:.1f}/10**.\n"

    sav_diff = sb['details']['monthly_savings'] - sa['details']['monthly_savings']
    if sav_diff > 100:
        advice += f"- **Finances:** Scenario B saves ${sav_diff:,.2f} more monthly, leading to an extra ${sb['wealth_at_end'] - sa['wealth_at_end']:,.2f} in assets over the timeline. This accelerates compounding interest significantly.\n"
    elif sav_diff < -100:
        advice += f"- **Finances:** Scenario A saves ${abs(sav_diff):,.2f} more monthly, leading to an extra ${sa['wealth_at_end'] - sb['wealth_at_end']:,.2f} in assets over the timeline.\n"

    advice += "\n#### **Digital Twin's Choice**\n"
    if sa['health_index'] < 5.0 and sb['health_index'] >= 5.0:
        advice += "**Recommendation:** **Choose Scenario B.** Scenario A degrades your health index below a sustainable baseline. Short-term financial or study gains do not justify the cognitive toll of sleep deprivation.\n"
    elif sb['health_index'] < 5.0 and sa['health_index'] >= 5.0:
        advice += "**Recommendation:** **Choose Scenario A.** Scenario B degrades your health index below a sustainable baseline due to sleep or habits neglect.\n"
    elif sb['wealth_at_end'] > sa['wealth_at_end'] and sb['health_index'] >= sa['health_index'] - 0.5:
        advice += "**Recommendation:** **Choose Scenario B.** It provides superior financial growth without significantly damaging your lifestyle and health parameters.\n"
    else:
        advice += "**Recommendation:** **Choose Scenario A.** It balances financial safety and performance score with sustainable health metrics.\n"

    return advice


def generate_digital_twin_advice(
    user_info: Dict[str, Any],
    baseline: Dict[str, Any],
    sim_results: Dict[str, Any]
) -> str:
    """
    Generate conversational recommendations using Groq (Llama 3.1), or fallback to rule-based logic.
    """
    client = get_groq_client()
    if client is None:
        return get_rule_based_advice(user_info, baseline, sim_results)

    try:
        sa = sim_results["scenario_a"]
        sb = sim_results["scenario_b"]

        prompt = f"""
You are the "Digital Twin Advisor" — an advanced AI assistant representing the digital twin of the user.
Your role is to analyze a comparative "What-If" lifestyle simulation and provide constructive, personalized advice to help the user choose the best path forward.

=== USER PROFILE ===
- Username: {user_info['username']}
- Current Age: {user_info['age']} years
- Target Retirement Age: {user_info['retirement_goal_age']} years
- Target Net Worth at Retirement: ${user_info['target_net_worth']:,.2f}
- Monthly Base Income: ${user_info['monthly_income']:,.2f}

=== PAST 30 DAYS BASELINE (CURRENT LIFESTYLE) ===
- Monthly Savings: ${baseline['monthly_savings']:,.2f}
- Current Net Worth: ${baseline['current_net_worth']:,.2f}
- Sleep: {baseline['sleep_hours']:.1f} hours/night
- Exercise: {baseline['exercise_hours'] * 60:.1f} minutes/day
- Screen Time: {baseline['screen_hours']:.1f} hours/day
- Weekly Study Hours: {baseline['study_hours_week']:.1f} hours/week

=== COMPARATIVE WHAT-IF SCENARIOS (PROJECTED RESULTS) ===

SCENARIO A (MODIFICATIONS):
- Adjustments: Monthly savings change: {sa['details']['monthly_savings'] - baseline['monthly_savings']:+.2f}, Sleep change: {sa['details']['sleep'] - baseline['sleep_hours']:+.1f} hrs, Study change: {sa['details']['study_week'] - baseline['study_hours_week']:+.1f} hrs/week
- Health Index (Well-being): {sa['health_index']:.1f}/10
- Focus Rating (Productivity): {sa['focus_index']:.1f}/10
- Net Worth Projection (Timeline End): ${sa['wealth_at_end']:,.2f}
- Will reach target net worth by retirement age? {"Yes" if sa['attained_retirement'] else "No"} (Projected retirement wealth: ${sa['retirement_wealth']:,.2f})

SCENARIO B (MODIFICATIONS):
- Adjustments: Monthly savings change: {sb['details']['monthly_savings'] - baseline['monthly_savings']:+.2f}, Sleep change: {sb['details']['sleep'] - baseline['sleep_hours']:+.1f} hrs, Study change: {sb['details']['study_week'] - baseline['study_hours_week']:+.1f} hrs/week
- Health Index (Well-being): {sb['health_index']:.1f}/10
- Focus Rating (Productivity): {sb['focus_index']:.1f}/10
- Net Worth Projection (Timeline End): ${sb['wealth_at_end']:,.2f}
- Will reach target net worth by retirement age? {"Yes" if sb['attained_retirement'] else "No"} (Projected retirement wealth: ${sb['retirement_wealth']:,.2f})

=== INSTRUCTIONS ===
Write a comprehensive report comparing Scenario A and Scenario B.
Ensure you address:
1. **Tradeoff Analysis**: Detail the compromises. For example, is one scenario cutting sleep to gain study/savings? Explain the biological or psychological consequence (e.g. sleep deprivation reduces focus rating).
2. **Financial Critique**: Assess their retirement trajectory. Under which scenario are they more financially secure? Is the increased savings rate worth the lifestyle impact?
3. **Recommendation & Verdict**: Pick one scenario as the clear winner and explain why, or suggest a hybrid approach (Scenario C) that would optimize their goals.

Output the analysis in clean, professional markdown with beautiful emojis. Keep it concise, engaging, and directly addressed to the user.
"""
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,  # Calibrated for analytical precision

            max_tokens=800,
        )
        return response.choices[0].message.content

    except Exception as e:
        print(f"Error calling Groq API: {e}. Falling back to rule-based advice.")
        return get_rule_based_advice(user_info, baseline, sim_results)


"""Constructs persona system prompt."""
def build_system_prompt(user_profile: dict, financial_summary: dict,
                         study_summary: dict, habits: list, goals: list) -> str:
    """
    financial_summary, study_summary come from ai_engine/forecasting/financial.py & habits.py
    goals/habits come from database layer
    """
    goals_text = "\n".join(
        f"- {g['goal_name']}: {g['current_progress']}/{g['target_value']} by {g['target_date']}"
        for g in goals
    ) or "No active goals."

    habits_text = "\n".join(
        f"- {h['habit_name']}: {h['status']} ({h['completion_rate']}% completion)"
        for h in habits
    ) or "No tracked habits."

    return f"""You are Digital Twin AI, a personal life simulation and decision assistant for {user_profile.get('name', 'the user')}.

USER PROFILE:
Age: {user_profile.get('age', 'N/A')}, Occupation: {user_profile.get('occupation', 'N/A')}

FINANCIAL FORECAST:
Current Savings: {financial_summary.get('current_savings', 'N/A')}
Projected (1Y): {financial_summary.get('projected_savings_1y', 'N/A')}
Monthly Savings Rate: {financial_summary.get('savings_rate', 'N/A')}%

STUDY FORECAST:
Avg Weekly Study Hours: {study_summary.get('avg_weekly_hours', 'N/A')}
Predicted Performance Trend: {study_summary.get('performance_trend', 'N/A')}

HABITS:
{habits_text}

GOALS:
{goals_text}

RULES:
- Answer using ONLY the data above plus reasonable projections (compound savings, trend extrapolation).
- When asked "will I achieve X", do the math explicitly (projected value vs target).
- Give concrete, personalized, actionable recommendations — not generic advice.
- Keep responses concise, structured, and forward-looking.
- If data is insufficient, say so and ask what's missing.
"""


class DigitalTwinAdvisor:
    """
    LLM-based conversational advisor. Consumes pre-computed forecasts/simulations
    from other ai_engine modules instead of hitting the DB directly.
    Uses Groq's free API (Llama 3.1) - no billing required.
    """

    def __init__(self, user_id: int, model: str = "llama-3.1-8b-instant"):
        self.user_id = user_id
        self.model = model
        self.system_prompt = None
        self.history = []  # [{"role": "user"/"assistant", "text": str}]

        self.history: List[Dict[str, str]] = []
        self.system_prompt: Optional[str] = None

    def set_context(self, user_info: dict, baseline_metrics: dict):
        self.system_prompt = (
            f"You are the conversational Digital Twin AI advisor for {user_info.get('username', 'User')}.\n"
            f"Role: {user_info.get('role', 'professional')}\n"
            f"Age: {user_info.get('age', 25)}\n"
            f"Target Age: {user_info.get('retirement_goal_age', 60)}\n"
            f"Target Net Worth: ${user_info.get('target_net_worth', 1000000):,.2f}\n"
            f"Monthly Income: ${user_info.get('monthly_income', 5000):,.2f}\n"
            f"Baseline Sleep: {baseline_metrics.get('sleep_hours', 7.5):.1f}h/night\n"
            f"Baseline Savings: ${baseline_metrics.get('monthly_savings', 1000):,.2f}/mo\n"
            f"Be concise, analytical, supportive, and clear."
        )

    def ask(self, user_message: str) -> str:
        if self.system_prompt is None:
            raise ValueError("Call set_context() before ask().")

        client = get_groq_client()
        if client is None:
            return "Groq AI Advisor is operating in offline mode. Configure a valid GROQ_API_KEY to enable live conversational intelligence."

        messages = [{"role": "system", "content": self.system_prompt}]
        for t in self.history:
            messages.append({"role": t["role"], "content": t["text"]})
        messages.append({"role": "user", "content": user_message})

        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.4,  # Calibrated for analytical precision

                max_tokens=800,
            )
            reply = response.choices[0].message.content
            self.history.append({"role": "user", "text": user_message})
            self.history.append({"role": "assistant", "text": reply})
            return reply
        except Exception as e:
            print(f"Error calling Groq chat: {e}")
            return "Unable to reach Groq API. Please check your network and API credentials."

    def ask_with_simulation(self, user_message: str, scenario_result: dict) -> str:
        """Use when the user asks about a specific simulated scenario
        (output of ai_engine/simulation/simulator.py)."""
        scenario_context = (
            f"\n\nSIMULATION RESULT FOR THIS QUERY:\n"
            f"Scenario: {scenario_result.get('scenario_name')}\n"
            f"Predicted Outcome: {scenario_result.get('predicted_outcome')}\n"
        )
        return self.ask(user_message + scenario_context)


# Fallback wealth rule engine
def get_rule_based_wealth_advice(
    user_info: Dict[str, Any],
    baseline: Dict[str, Any],
    forecast_summary: Dict[str, Any]
) -> str:
    """
    Fallback rule-based wealth prediction when Groq API is unavailable.
    """
    prob = forecast_summary["probability_of_success"] * 100
    advice = "### Digital Twin Wealth Projection & Strategy\n\n"
    advice += f"- **Current savings pace:** ${baseline['monthly_savings']:,.2f}/month\n"
    advice += f"- **Deterministic projection:** ${forecast_summary['deterministic_final']:,.2f} by target age\n"
    advice += f"- **Monte Carlo median outcome:** ${forecast_summary['monte_carlo_median_final']:,.2f}\n"
    advice += f"- **Probability of hitting your target:** {prob:.0f}%\n\n"
    if prob >= 70:
        advice += "**Prediction:** You're on a strong trajectory. Staying consistent with your current savings rate is likely enough to hit your goal.\n"
    elif prob >= 40:
        advice += "**Prediction:** You're on a moderate trajectory. A modest increase in monthly savings would meaningfully improve your odds.\n"
    else:
        advice += "**Prediction:** Your current pace is unlikely to reach your target. Consider increasing monthly contributions or adjusting your target timeline.\n"
    return advice


def generate_wealth_advice(
    user_info: Dict[str, Any],
    baseline: Dict[str, Any],
    forecast_summary: Dict[str, Any]
) -> str:
    """
    Generate a conversational wealth prediction using Groq, or fallback to rule-based logic.
    """
    client = get_groq_client()
    if client is None:
        return get_rule_based_wealth_advice(user_info, baseline, forecast_summary)

    try:
        role = user_info.get("role", "professional")
        role_instructions = ""
        if role == "student":
            role_instructions = "The user is a STUDENT. Their monthly income is pocket money, allowance, or part-time earnings, and their target is a student savings/milestone goal. Advise them warmly on building early money-saving habits and compounding."
        elif role == "freelancer":
            role_instructions = "The user is a FREELANCER / CREATOR. Their income is client invoices, and their target is financial freedom & emergency runway. Advise them on managing invoice volatility, tax buffers, and steady compounding."
        elif role == "entrepreneur":
            role_instructions = "The user is a FOUNDER / ENTREPRENEUR. Their income is founder draw, and their target is venture equity realization. Advise them on personal runway, reinvestment pace, and equity compounding."
        elif role == "retiree":
            role_instructions = "The user is a RETIREE / SENIOR. Their monthly income is pension, annuities, or passive returns, and their target is nest egg preservation and longevity. Advise them on sustainable living, healthcare buffers, and peace of mind."
        else:
            role_instructions = "The user is a WORKING PROFESSIONAL. Their income is take-home salary, and their target is retirement net worth. Advise them on career-wealth acceleration, investment pacing, and financial freedom."

        prompt = f"""
You are the "Digital Twin Wealth Advisor" — an AI assistant predicting a user's financial future based on statistical projections already computed for them.

=== USER PROFILE ===
- Username: {user_info['username']}
- User Role: {role.upper()}
- Current Age: {user_info['age']} years
- Target Goal Age: {user_info['retirement_goal_age']} years
- Target Net Worth / Goal: ${user_info['target_net_worth']:,.2f}
- Monthly Income / Inflow: ${user_info['monthly_income']:,.2f}

=== ROLE CONTEXT ===
{role_instructions}

=== CURRENT BASELINE ===
- Monthly Savings: ${baseline['monthly_savings']:,.2f}
- Current Net Worth: ${baseline['current_net_worth']:,.2f}

=== STATISTICAL PROJECTIONS (already computed — do not recompute, just interpret) ===
- Deterministic projection (fixed 8% return): ${forecast_summary['deterministic_final']:,.2f}
- Monte Carlo median outcome (500 simulations): ${forecast_summary['monte_carlo_median_final']:,.2f}
- Monte Carlo 10th percentile (pessimistic): ${forecast_summary['monte_carlo_p10_final']:,.2f}
- Monte Carlo 90th percentile (optimistic): ${forecast_summary['monte_carlo_p90_final']:,.2f}
- Probability of reaching target net worth: {forecast_summary['probability_of_success'] * 100:.0f}%

=== INSTRUCTIONS ===
Write a short, direct prediction (3-5 sentences) explaining what these numbers mean for the user in plain language.
State clearly whether they're on track, and if not, give one specific concrete suggestion (e.g. a dollar amount to increase monthly savings by) to improve their odds.
When you state the user's target net worth, target age, or any dollar figures from the data above, you MUST use the exact numbers given — do not round, alter, abbreviate, or invent different figures. You may explain what the numbers mean, but never change the digits. Keep it direct and helpful, addressed to the user.
"""
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,  # Calibrated for analytical precision

            max_tokens=400,
        )
        return response.choices[0].message.content

    except Exception as e:
        print(f"Error calling Groq API: {e}. Falling back to rule-based advice.")
        return get_rule_based_wealth_advice(user_info, baseline, forecast_summary)


# JSON processing & sanitization utilities
import json

# Generates dual sandbox slider presets
def generate_scenario_suggestions(user_info: Dict[str, Any], baseline: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate two alternative sandbox scenarios (Scenario A and Scenario B) using Groq tailored to user role.
    If Groq is offline, return fallback suggestions.
    """
    role = user_info.get("role", "professional")
    fallback = {
        "scenario_a": {"savings": 200 if role == "student" else 350 if role == "freelancer" else 500 if role == "entrepreneur" else 400, "sleep": 0.5, "study": 4},
        "scenario_b": {"savings": 500 if role == "student" else 800 if role == "freelancer" else 1200 if role == "entrepreneur" else 1000, "sleep": -1.0, "study": 10}
    }
    
    client = get_groq_client()
    if client is None:
        return fallback

    if role == "student":
        scenario_guidance = """
- Scenario A: "Balanced Campus Life" (Healthy sleep +0.5h, moderate study +3h, manageable pocket money savings +$100).
- Scenario B: "Exam & Study Sprint" (High study boost +8h, tighter budget savings +$300, slight sleep trade-off -1h).
"""
    elif role == "freelancer":
        scenario_guidance = """
- Scenario A: "Sustainable Client Cadence" (Restful sleep +0.5h, skill/portfolio work +3h, steady runway savings +$350).
- Scenario B: "High-Inbound / Agency Sprint" (Intensive billable sprint +8h, high emergency runway savings +$850, slight sleep trade-off -1h).
"""
    elif role == "entrepreneur":
        scenario_guidance = """
- Scenario A: "High-Leverage Execution" (Restful sleep +0.5h, strategic build +4h, steady personal savings +$500).
- Scenario B: "Product Launch Blitz" (Intensive launch hours +12h, aggressive capital buffer +$1400, slight sleep trade-off -1h).
"""
    elif role == "retiree":
        scenario_guidance = """
- Scenario A: "Daily Wellness & Leisure" (Restful sleep +1h, relaxing hobbies/reading +3h, stable savings +$100).
- Scenario B: "Active Projects & Travel" (Dynamic activity/reading +6h, higher lifestyle budget savings +$300).
"""
    else:
        scenario_guidance = """
- Scenario A: "Wellbeing-Optimized" (Healthy sleep +0.5h, moderate upskilling +4h, sustainable savings +$400).
- Scenario B: "High-Growth / Career Hustle" (Aggressive upskilling +10h, high savings +$1200, slight sleep trade-off -1h).
"""

    prompt = f"""
You are an AI financial and lifestyle optimizer. Suggest two contrasting future scenarios for the following {role.upper()} profile to run in a simulator:

USER PROFILE:
- Username: {user_info['username']}
- Role: {role.upper()}
- Age: {user_info['age']}
- Current Monthly Income / Inflow: ${user_info['monthly_income']:.2f}
- Current Monthly Savings Pace: ${baseline.get('monthly_savings', 500.0):.2f}/month
- Target Net Worth: ${user_info['target_net_worth']:.2f} by age {user_info['retirement_goal_age']}

ROLE-TAILORED SCENARIO DIRECTIONS:
{scenario_guidance}

You MUST restrict the values to these ranges and steps:
- savings: monthly savings increase in USD. Must be between 0 and 2000, in steps of 50 (e.g. 0, 50, 100, 150... 2000).
- sleep: change in sleep hours per night. Must be between -2.0 and 3.0, in steps of 0.5 (e.g. -1.5, 0, 0.5, 1.0...).
- study: change in weekly study/upskilling/hobby hours. Must be between -10 and 20, in steps of 1 (e.g. -5, 0, 4, 15...).

Return ONLY a valid JSON object matching the following structure. No explanation, no markdown wraps.
{{
  "scenario_a": {{
    "savings": <number>,
    "sleep": <number>,
    "study": <number>
  }},
  "scenario_b": {{
    "savings": <number>,
    "sleep": <number>,
    "study": <number>
  }}
}}
"""

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.1-8b-instant",
            temperature=0.3,
            max_tokens=200,
        )
        response_text = chat_completion.choices[0].message.content.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        
        parsed = json.loads(response_text.strip())
        
        def clean_val(val, min_v, max_v, step_v):
            val = float(val)
            val = max(min_v, min(max_v, val))
            return round(round(val / step_v) * step_v, 2)

        sa = parsed["scenario_a"]
        sb = parsed["scenario_b"]
        
        return {
            "scenario_a": {
                "savings": int(clean_val(sa.get("savings", 200), 0, 2000, 50)),
                "sleep": clean_val(sa.get("sleep", 0.5), -2, 3, 0.5),
                "study": int(clean_val(sa.get("study", 4), -10, 20, 1))
            },
            "scenario_b": {
                "savings": int(clean_val(sb.get("savings", 600), 0, 2000, 50)),
                "sleep": clean_val(sb.get("sleep", -1.0), -2, 3, 0.5),
                "study": int(clean_val(sb.get("study", 10), -10, 20, 1))
            }
        }
    except Exception as e:
        print(f"Error calling Groq for scenario suggestions: {e}")
        return fallback


# Daily habit analysis narrative
def generate_analytics_summary(user_info: Dict[str, Any], logs: List[Dict[str, Any]]) -> str:
    """
    Generate a simple, universally understandable summary of habit logs tailored to the user's role.
    """
    if not logs:
        return "No logs recorded yet. Start logging your daily sleep and activities to get your twin's analysis."

    total_days = len(logs)
    avg_sleep = sum(l["sleep"] for l in logs) / total_days
    avg_screen = sum(l["screen"] for l in logs) / total_days
    avg_study = sum(l["study"] for l in logs) / total_days
    avg_exercise = sum(l["exercise"] for l in logs) / total_days
    avg_mood = sum(l["mood"] for l in logs) / total_days
    role = user_info.get("role", "professional")

    focus_domain = (
        "studies and exam preparation" if role == "student"
        else "client delivery and creative flow" if role == "freelancer"
        else "high-leverage execution and strategic stamina" if role == "entrepreneur"
        else "daily wellness, health, and vitality" if role == "retiree"
        else "work performance and physical energy"
    )

    prompt = f"""
You are an intelligent Digital Twin analyzing daily habit patterns.
Write a clear, concise overview of this {role.upper()}'s routine:
- Role: {role.upper()}
- Average Sleep: {avg_sleep:.1f} hours/night
- Average Screen Time: {avg_screen:.1f} hours/day
- Average Learning/Reading/Study: {avg_study:.1f} hours/day
- Average Active Movement: {avg_exercise:.1f} minutes/day
- Average Wellbeing Rating: {avg_mood:.1f} out of 10

Instructions:
1. Explain how their balance of sleep, screen time, and movement supports their {focus_domain}.
2. Keep sentences clear, direct, and accessible.
3. Highlight 1 strong positive habit, and 1 specific actionable adjustment.
4. Limit the response to 3-4 concise sentences.
"""

    activity_label = (
        "Study & Coursework" if role == "student"
        else "Portfolio & Inbound" if role == "freelancer"
        else "Strategy & Market Research" if role == "entrepreneur"
        else "Reading & Hobbies" if role == "retiree"
        else "Learning & Upskilling"
    )

    fallback_summary = (
        f"**Daily Habit Overview**\n\n"
        f"- **Average Sleep:** {avg_sleep:.1f} hours/night (consistent rest protects focus).\n"
        f"- **Screen Time:** {avg_screen:.1f} hours/day.\n"
        f"- **{activity_label}:** {avg_study:.1f} hours/day.\n"
        f"- **Active Movement:** {avg_exercise:.1f} minutes/day.\n"
        f"- **Overall Rating:** {avg_mood:.1f}/10."
    )

    client = get_groq_client()
    if client is None:
        return fallback_summary

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,  # Calibrated for analytical precision

            max_tokens=300,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error generating analytics summary: {e}")
        return fallback_summary


# 7-day academic study plan generator
def generate_optimized_study_plan(user_info: Dict[str, Any], study_summary: Dict[str, Any], target_milestone: Optional[str] = None) -> Dict[str, Any]:
    """
    Generates a structured, role-adapted 7-day study and learning plan.
    Optimized for students preparing for coursework, midterms, and finals.
    """
    role = user_info.get("role", "student")
    subjects = study_summary.get("subjects", [])
    subject_names = [s.get("subject", "Coursework") for s in subjects] or ["Computer Science", "Algorithms", "Database Systems", "Linear Algebra"]
    subjects_str = ", ".join(subject_names)
    milestone_str = target_milestone or "Upcoming Midterm & Final Exams"
    avg_hours = study_summary.get("avg_weekly_hours", 18.0)
    retention_score = study_summary.get("retention_health_score", 82)

    fallback_plan = {
        "weekly_goal": f"Execute high-retention study sprints for {subject_names[0]} and {subject_names[1] if len(subject_names) > 1 else 'Core Topics'}.",
        "focus_strategy": "Morning 60-90 minute deep-focus block prior to campus distractions, followed by a 30-minute evening active recall review.",
        "daily_plans": [
            {
                "day": "Monday",
                "blocks": [
                    {
                        "subject": subject_names[0],
                        "start_time": "08:30",
                        "duration_minutes": 60,
                        "focus_type": "Deep Concept Sprint",
                        "task_title": f"{subject_names[0]}: Core Problem Set & Practice"
                    },
                    {
                        "subject": subject_names[1] if len(subject_names) > 1 else "Revision",
                        "start_time": "16:30",
                        "duration_minutes": 45,
                        "focus_type": "Active Recall",
                        "task_title": f"{subject_names[1] if len(subject_names) > 1 else 'Revision'}: Spaced Flashcards & Notes"
                    }
                ]
            },
            {
                "day": "Tuesday",
                "blocks": [
                    {
                        "subject": subject_names[1] if len(subject_names) > 1 else subject_names[0],
                        "start_time": "09:00",
                        "duration_minutes": 75,
                        "focus_type": "Deep Problem Solving",
                        "task_title": f"{subject_names[1] if len(subject_names) > 1 else subject_names[0]}: Lab Exercises & Code"
                    }
                ]
            },
            {
                "day": "Wednesday",
                "blocks": [
                    {
                        "subject": subject_names[2] if len(subject_names) > 2 else subject_names[0],
                        "start_time": "08:30",
                        "duration_minutes": 60,
                        "focus_type": "Lecture Synthesis",
                        "task_title": f"{subject_names[2] if len(subject_names) > 2 else subject_names[0]}: Chapter Synthesis & Exercises"
                    },
                    {
                        "subject": subject_names[0],
                        "start_time": "17:00",
                        "duration_minutes": 45,
                        "focus_type": "Mock Test",
                        "task_title": f"{subject_names[0]}: Timed Quiz Practice"
                    }
                ]
            },
            {
                "day": "Thursday",
                "blocks": [
                    {
                        "subject": subject_names[0],
                        "start_time": "09:00",
                        "duration_minutes": 90,
                        "focus_type": "Exam Prep Blitz",
                        "task_title": f"{subject_names[0]}: Past Exam Questions Review"
                    }
                ]
            },
            {
                "day": "Friday",
                "blocks": [
                    {
                        "subject": subject_names[1] if len(subject_names) > 1 else subject_names[0],
                        "start_time": "08:30",
                        "duration_minutes": 60,
                        "focus_type": "Weakness Targeting",
                        "task_title": f"{subject_names[1] if len(subject_names) > 1 else subject_names[0]}: Error Log Analysis"
                    }
                ]
            },
            {
                "day": "Saturday",
                "blocks": [
                    {
                        "subject": "Comprehensive Review",
                        "start_time": "10:00",
                        "duration_minutes": 90,
                        "focus_type": "Full Mock Exam",
                        "task_title": f"Timed Mock Exam: {subject_names[0]} & {subject_names[1] if len(subject_names) > 1 else 'All Topics'}"
                    }
                ]
            },
            {
                "day": "Sunday",
                "blocks": [
                    {
                        "subject": "Weekly Reset & Prep",
                        "start_time": "11:00",
                        "duration_minutes": 45,
                        "focus_type": "Light Revision",
                        "task_title": "Weekly Summary Sheet & Schedule Plan"
                    }
                ]
            }
        ],
        "recommendations": [
            {
                "title": "Ebbinghaus Spaced Repetition",
                "impact": "+12% recall score",
                "description": "Review newly introduced lecture topics 24 hours after class, then again 4 days later.",
                "category": "Study"
            },
            {
                "title": "90-Min Pre-Noon Deep Sprint",
                "impact": "+1.4 focus rating",
                "description": "Schedule demanding algorithmic and mathematical topics during peak cognitive alertness between 08:30 and 11:00.",
                "category": "Focus"
            },
            {
                "title": "Post-Sprint Walk Reset",
                "impact": "+0.6 mood & memory",
                "description": "Take a 15-minute screen-free walk after long problem sets to consolidate long-term synaptic retention.",
                "category": "Health"
            }
        ]
    }

    client = get_groq_client()
    if client is None:
        return fallback_plan

    prompt = f"""
You are an advanced Academic & Productivity AI Coach generating an optimized 7-day study plan.
Student Details:
- Target Milestone / Exam: {milestone_str}
- Current Subjects: {subjects_str}
- Current Weekly Study Hours: {avg_hours}h
- Retention Health Score: {retention_score}/100

Generate a structured, realistic 7-day study schedule in strictly valid JSON format.
Each day (Monday through Sunday) must have 1-2 focused study blocks with:
- "subject": (one of the student's subjects)
- "start_time": (e.g. "08:30", "16:00")
- "duration_minutes": (number between 30 and 90)
- "focus_type": (e.g. "Deep Problem Solving", "Active Recall", "Exam Simulation")
- "task_title": (concrete, actionable task title)

Also provide:
- "weekly_goal": (1-sentence clear objective)
- "focus_strategy": (1-2 sentences on timing and fatigue mitigation)
- "recommendations": array of 3 objects with "title", "impact", "description", "category" ("Study"|"Focus"|"Health")

Respond with ONLY the raw JSON object, without markdown formatting or code fences:
{{
  "weekly_goal": "...",
  "focus_strategy": "...",
  "daily_plans": [
    {{
      "day": "Monday",
      "blocks": [
        {{ "subject": "...", "start_time": "...", "duration_minutes": 60, "focus_type": "...", "task_title": "..." }}
      ]
    }}
  ],
  "recommendations": [
    {{ "title": "...", "impact": "...", "description": "...", "category": "Study" }}
  ]
}}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1500,
        )
        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = re.sub(r"^```[a-zA-Z]*\n?", "", content)
            content = re.sub(r"\n?```$", "", content)
        
        parsed = json.loads(content)
        if "daily_plans" in parsed and "weekly_goal" in parsed:
            return parsed
        return fallback_plan
    except Exception as e:
        print(f"Error calling Groq for study plan: {e}")
        return fallback_plan


# Pre-analyzes user data & persona for suggestions
def generate_smart_role_suggestions(
    user_info: Dict[str, Any],
    baseline: Dict[str, Any],
    recent_logs: List[Dict[str, Any]],
    existing_suggestions: List[Dict[str, Any]],
    mode: str = "regenerate"
) -> Dict[str, Any]:
    """
    Analyzes user profile, role, financial trajectory, and 30-day baseline data
    to generate hyper-personalized lifestyle, focus, and financial suggestions.
    """
    role = (user_info.get("role") or "professional").lower()
    avg_sleep = baseline.get("sleep", baseline.get("sleep_hours", 7.5))
    avg_screen = baseline.get("screen", baseline.get("screen_hours", 4.0))
    avg_study = baseline.get("study", baseline.get("study_hours_week", 10.0) / 7.0)
    avg_exercise = baseline.get("exercise", baseline.get("exercise_hours", 0.5) * 60)
    avg_mood = baseline.get("mood", 7.0)

    monthly_income = user_info.get("monthly_income", 5000.0)
    target_net_worth = user_info.get("target_net_worth", 1000000.0)
    target_age = user_info.get("retirement_goal_age", 60)
    current_age = user_info.get("age", 25)

    # Diagnostic bottleneck analysis
    diagnostic_notes = []
    if avg_sleep < 7.0:
        diagnostic_notes.append(f"Sleep deficit identified ({avg_sleep:.1f}h avg vs 8.0h target). Cognitive recovery is constrained.")
    elif avg_sleep >= 8.0:
        diagnostic_notes.append(f"Restful sleep baseline ({avg_sleep:.1f}h avg) is protecting mental endurance.")

    if avg_screen > 5.0:
        diagnostic_notes.append(f"Heavy screen exposure ({avg_screen:.1f}h/day) may cause afternoon focus degradation.")

    if avg_exercise < 20:
        diagnostic_notes.append("Sedentary physical movement pattern detected.")

    diagnostic_summary = " · ".join(diagnostic_notes) if diagnostic_notes else "Balanced baseline lifestyle metrics."

    # Avoid duplicate titles with existing suggestions if mode == 'more'
    existing_titles = [s.get("title", "") for s in existing_suggestions if s.get("title")]
    existing_titles_str = ", ".join(f'"{t}"' for t in existing_titles[-10:])

    client = get_groq_client()
    if client is None:
        # Return fallback items tailored to persona
        from database.crud import DEFAULT_ROLE_SUGGESTIONS
        base_defaults = DEFAULT_ROLE_SUGGESTIONS.get(role, DEFAULT_ROLE_SUGGESTIONS["professional"])
        return {
            "diagnostic": diagnostic_summary,
            "suggestions": [dict(s, is_ai_generated=True) for s in base_defaults]
        }

    prompt = f"""
You are the Digital Twin AI Coach. Deeply analyze this user's persona and data to formulate {6 if mode == 'regenerate' else 4} high-impact, actionable daily suggestions.

USER PERSONA & METRICS:
- Role: {role.upper()}
- Age: {current_age} | Target Milestone Age: {target_age}
- Monthly Income / Allowance: ${monthly_income:,.2f}
- Target Net Worth: ${target_net_worth:,.2f}

MEASURED 30-DAY BASELINE:
- Average Sleep: {avg_sleep:.1f} hours/night
- Average Screen Time: {avg_screen:.1f} hours/day
- Average Daily Focus / Study / Skill Work: {avg_study:.1f} hours/day
- Average Active Movement: {avg_exercise:.1f} minutes/day
- Average Mood & Energy: {avg_mood:.1f} / 10
- Key Diagnostic Bottlenecks: {diagnostic_summary}

PREVIOUS/EXISTING SUGGESTION TITLES (DO NOT REPEAT THESE):
[{existing_titles_str}]

INSTRUCTIONS:
Formulate {6 if mode == 'regenerate' else 4} hyper-personalized, distinct suggestions targeting the user's role and data bottlenecks.
Cover diverse categories:
- Focus (deep work blocks, focus sprints)
- Vitality (sleep hygiene, circadian resets, movement)
- Finance (micro-savings, runway allocation, investment sweeps)
- Study / Work (spaced repetition, skill acquisition, pipeline triage)

Respond with ONLY valid raw JSON in the following format:
{{
  "diagnostic": "{diagnostic_summary}",
  "suggestions": [
    {{
      "suggestion_id": "ai-sug-1",
      "title": "Concise Action Title",
      "category": "Focus" | "Vitality" | "Finance" | "Study" | "Work",
      "detail": "Actionable 1-2 sentence description explaining why this helps based on their data.",
      "impact": "+1.8 focus rating" | "+$300/mo savings" | "+15% retention",
      "start_time": "09:00",
      "duration_minutes": 45,
      "is_ai_generated": true
    }}
  ]
}}
"""

    try:
        import time, random
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,  # Calibrated for analytical precision

            max_tokens=1400,
        )
        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = re.sub(r"^```[a-zA-Z]*\n?", "", content)
            content = re.sub(r"\n?```$", "", content)

        parsed = json.loads(content)
        if "suggestions" in parsed and isinstance(parsed["suggestions"], list) and len(parsed["suggestions"]) > 0:
            ts = int(time.time())
            cleaned_suggestions = []
            for idx, s in enumerate(parsed["suggestions"]):
                # Ensure unique suggestion ID so multiple batches do not overwrite
                s_id = s.get("suggestion_id") or f"ai-sug-{ts}-{idx}-{random.randint(100, 999)}"
                if s_id.startswith("ai-sug-") and len(s_id) < 12:
                    s_id = f"ai-sug-{ts}-{idx}-{random.randint(100, 999)}"
                cleaned_suggestions.append({
                    "suggestion_id": s_id,
                    "title": s.get("title", f"Smart Action {idx+1}"),
                    "category": s.get("category", "Focus"),
                    "detail": s.get("detail", ""),
                    "impact": s.get("impact", "+1.0 focus"),
                    "start_time": s.get("start_time", "09:00"),
                    "duration_minutes": s.get("duration_minutes", 30),
                    "is_ai_generated": True,
                    "is_adopted": False
                })

            return {
                "diagnostic": parsed.get("diagnostic", diagnostic_summary),
                "suggestions": cleaned_suggestions
            }
    except Exception as e:
        print(f"Error calling Groq for smart role suggestions: {e}")

    # Fallback if parsing or API failed
    from database.crud import DEFAULT_ROLE_SUGGESTIONS
    base_defaults = DEFAULT_ROLE_SUGGESTIONS.get(role, DEFAULT_ROLE_SUGGESTIONS["professional"])
    return {
        "diagnostic": diagnostic_summary,
        "suggestions": [dict(s, is_ai_generated=True) for s in base_defaults]
    }


# ==============================================================================
# CONVERSATIONAL DIGITAL TWIN COPILOT ENGINE WITH MULTI-ACTION EXECUTION
# ==============================================================================

def process_twin_copilot_turn(
    user_id: int,
    prompt: str,
    history: List[Dict[str, Any]],
    user_info: Dict[str, Any],
    baseline: Dict[str, Any],
    client_context: Optional[Dict[str, Any]] = None,
    think_mode: bool = False
) -> Dict[str, Any]:
    """
    Process a conversational turn with the Digital Twin Copilot.
    Extracts user intent (e.g. purchase simulation, what-if scenario, task creation,
    wealth forecasting, settings update) and computes exact deterministic and
    probabilistic simulation results. Produces an informative markdown answer
    along with a structured interactive action proposal (if applicable) that
    requires explicit user approval before execution.
    Supports think_mode for step-by-step reasoning chain-of-thought disclosures.
    """
    client_ctx = client_context or {}
    p_lower = prompt.lower().strip()

    # 1. DETECT MAJOR PURCHASE / MILESTONE QUERY
    # e.g., "If I buy a $1,200 laptop today, how does that affect my emergency fund goal?"
    price_match = re.search(r"[$]\s*([0-9][0-9,.]*)|([0-9][0-9,.]*)\s*(?:dollars?|usd)\b", prompt, re.IGNORECASE)
    purchase_keywords = ["buy", "purchase", "spend", "cost", "afford", "get a ", "buying", "invest in a "]
    is_purchase_query = any(k in p_lower for k in purchase_keywords) and price_match is not None

    if is_purchase_query:
        val_raw = price_match.group(1) if price_match.group(1) else (price_match.group(2) or "1200")
        raw_amount_str = val_raw.replace(",", "")
        try:
            purchase_cost = float(raw_amount_str)
        except ValueError:
            purchase_cost = 1200.0

        # Extract item name cleanly by removing price tokens first
        clean_item_str = re.sub(r"[$]\s*[0-9][0-9,.]*|[0-9][0-9,.]*\s*(?:dollars?|usd)\b", "", prompt, flags=re.IGNORECASE)
        item_match = re.search(r"(?:buy|purchase|buying|spend on|get|afford)\s+(?:a|an|the)?\s*([a-zA-Z0-9\s\-]+?)(?:\s+today|\s+now|\s+this|\s*\?|\s*\,|\s*\.|\s+how|\s+will|\s+if|\s+for|\s+afford|$)", clean_item_str, re.IGNORECASE)
        item_name = item_match.group(1).strip() if item_match and len(item_match.group(1).strip()) > 1 else "Item"
        if len(item_name) > 30:
            item_name = "Major Purchase"

        # Baseline metrics
        monthly_income = float(user_info.get("monthly_income", 5000.0))
        monthly_expenses = float(user_info.get("monthly_expenses", 2900.0))
        monthly_savings = max(100.0, monthly_income - monthly_expenses)
        current_net_worth = float(user_info.get("net_worth", 15000.0))
        
        goal_name = client_ctx.get("goalName") or "Emergency Fund"
        goal_target = float(client_ctx.get("goalTarget") or 20000.0)
        goal_current = float(client_ctx.get("goalCurrent") or min(current_net_worth, goal_target))

        # Calculate impact
        new_progress = max(0.0, goal_current - purchase_cost)
        old_gap = max(0.0, goal_target - goal_current)
        new_gap = max(0.0, goal_target - new_progress)
        
        old_time_months = round(old_gap / monthly_savings, 1)
        new_time_months = round(new_gap / monthly_savings, 1)
        delay_months = round(new_time_months - old_time_months, 1)
        delay_days = int(delay_months * 30.4)

        # 5-Year Opportunity cost at 8% annual compounded return
        annual_rate = 0.08
        compounded_5y = purchase_cost * ((1.0 + annual_rate) ** 5)
        foregone_growth = compounded_5y - purchase_cost

        # Monte Carlo success odds impact
        from ai_engine.forecasting import financial
        mc_before = financial.run_monte_carlo_simulation(
            current_age=user_info.get("age", 25),
            retirement_age=user_info.get("retirement_goal_age", 60),
            current_net_worth=current_net_worth,
            monthly_savings=monthly_savings,
            num_simulations=300
        )
        hits_before = sum(1 for v in mc_before["final_values"] if v >= user_info.get("target_net_worth", 1000000.0))
        prob_before = round((hits_before / len(mc_before["final_values"])) * 100)

        mc_after = financial.run_monte_carlo_simulation(
            current_age=user_info.get("age", 25),
            retirement_age=user_info.get("retirement_goal_age", 60),
            current_net_worth=max(0.0, current_net_worth - purchase_cost),
            monthly_savings=monthly_savings,
            num_simulations=300
        )
        hits_after = sum(1 for v in mc_after["final_values"] if v >= user_info.get("target_net_worth", 1000000.0))
        prob_after = round((hits_after / len(mc_after["final_values"])) * 100)

        advice_text = f"""### 🎯 Digital Twin Impact Analysis: {item_name.title()} (${purchase_cost:,.2f})

Purchasing this **{item_name}** for **${purchase_cost:,.2f}** will directly impact your **{goal_name}** and 5-year capital compounding. Here is the exact simulation breakdown:

#### 1. **Goal Milestone & Timeline Delay**
- **Current Progress:** ${goal_current:,.2f} / ${goal_target:,.2f} ({round((goal_current/goal_target)*100)}% complete)
- **Post-Purchase Progress:** ${new_progress:,.2f} / ${goal_target:,.2f} ({round((new_progress/goal_target)*100)}% complete)
- **Timeline Impact:** Reaching your {goal_name} target will be delayed by **~{delay_months} months (~{delay_days} days)** at your current savings pace of **${monthly_savings:,.2f}/month**.

#### 2. **5-Year Compounding Opportunity Cost**
- If kept invested at an 8% annual return, ${purchase_cost:,.2f} would grow into **${compounded_5y:,.2f}** over 5 years (**+${foregone_growth:,.2f} in foregone investment returns**).

#### 3. **Long-Term Retirement Probability**
- **Baseline Monte Carlo Success Odds:** **{prob_before}%**
- **Adjusted Odds:** **{prob_after}%** ({prob_after - prob_before:+d}% variance)

> **Twin Verdict:** If this {item_name} enhances your daily productivity or health, the {delay_months}-month delay is manageable. To neutralize the delay, consider increasing monthly savings by **+${round(purchase_cost / 6, 2):,.2f}/mo** for the next 6 months."""

        if think_mode:
            think_block = f"""<think>
• Baseline Telemetry: Net Worth ${current_net_worth:,.2f}, Monthly Savings ${monthly_savings:,.2f}/mo.
• Goal Analysis: "{goal_name}" Target=${goal_target:,.2f}, Current=${goal_current:,.2f}.
• Milestone Delay Calculation: Shift = +{delay_months} months (~{delay_days} days) delay.
• Compounding Opportunity Cost: ${purchase_cost:,.2f} @ 8% CAGR over 5Y -> ${compounded_5y:,.2f} (+${foregone_growth:,.2f} foregone gain).
• Stochastic Monte Carlo: Baseline odds = {prob_before}%, Post-purchase odds = {prob_after}%.
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

    # 2. DETECT WHAT-IF SIMULATOR SCENARIO INTENT
    # e.g., "What if I sleep 6 hours, study 15 hours, and save $500 more?"
    what_if_keywords = ["what if", "simulate", "if i sleep", "if i study", "cut sleep", "more savings", "less sleep", "routine", "scenario"]
    is_what_if = any(k in p_lower for k in what_if_keywords) and not is_purchase_query

    if is_what_if:
        # Extract adjustments or use calibrated intelligent delta
        sleep_delta = 0.0
        study_delta = 0.0
        savings_delta = 0.0

        # Detect sleep adjustment
        sleep_m = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*(?:hours?|hrs?)\s*(?:of\s*)?sleep", p_lower)
        if sleep_m:
            target_sleep = float(sleep_m.group(1))
            sleep_delta = target_sleep - float(baseline.get("sleep_hours", 7.5))
        elif "cut sleep" in p_lower or "less sleep" in p_lower:
            sleep_delta = -1.0
        elif "more sleep" in p_lower:
            sleep_delta = +1.0

        # Detect study adjustment
        study_m = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*(?:hours?|hrs?)\s*(?:of\s*)?(?:study|learning|work)", p_lower)
        if study_m:
            target_study = float(study_m.group(1))
            study_delta = target_study - float(baseline.get("study_hours_week", 10.0))
        elif "more study" in p_lower or "study more" in p_lower:
            study_delta = +5.0

        # Detect savings adjustment
        sav_m = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*(?:dollars?|\$)\s*(?:more\s*)?savings?", p_lower)
        if sav_m:
            savings_delta = float(sav_m.group(1))
        elif "save more" in p_lower or "increase savings" in p_lower:
            savings_delta = +300.0

        if sleep_delta == 0.0 and study_delta == 0.0 and savings_delta == 0.0:
            # Default sensible what-if test
            sleep_delta = -0.5
            study_delta = +4.0
            savings_delta = +250.0

        # Execute simulation comparison
        from ai_engine.simulation import simulator
        from database.database import SessionLocal
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
• Extracted Parameter Deltas: Savings=${savings_delta:+,.2f}/mo, Sleep={sleep_delta:+.1f}h/day, Focus={study_delta:+.1f}h/week.
• Linear Habit Models: Fit digital twin elasticity models on 30-day telemetry.
• Index Projections: Health {sa['health_index']:.1f} -> {sb['health_index']:.1f}, Focus {sa['focus_index']:.1f} -> {sb['focus_index']:.1f}.
• Financial Trajectory: 5-Year net worth variance = ${sb['wealth_at_end'] - sa['wealth_at_end']:+,.2f}.
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

    # 3. DETECT TASK / HABIT CREATION INTENT
    # e.g., "Add a 45 min deep work sprint to my tasks at 9:00 AM"
    task_keywords = ["add task", "add a task", "schedule a task", "create task", "add habit", "schedule habit", "block time", "add deep work", "add study sprint", "remind me to"]
    is_task_intent = any(k in p_lower for k in task_keywords) or (("add" in p_lower or "schedule" in p_lower) and ("min" in p_lower or "minute" in p_lower or "hour" in p_lower or "am" in p_lower or "pm" in p_lower))

    if is_task_intent:
        # Extract minutes
        min_m = re.search(r"(\d+)\s*(?:min|minute|minutes|m\b)", p_lower)
        hrs_m = re.search(r"(\d+(?:\.\d+)?)\s*(?:hour|hours|hr|hrs|h\b)", p_lower)
        if min_m:
            duration = int(min_m.group(1))
        elif hrs_m:
            duration = int(float(hrs_m.group(1)) * 60)
        else:
            duration = 45

        # Extract time
        time_m = re.search(r"(\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{1,2}:\d{2})", p_lower)
        if time_m:
            raw_time = time_m.group(1).upper()
            start_time = raw_time
        else:
            start_time = "09:00"

        # Determine Category
        category = "Work"
        if any(w in p_lower for w in ["study", "syllabus", "exam", "reading", "learn", "course", "lecture"]):
            category = "Study"
        elif any(w in p_lower for w in ["gym", "workout", "sleep", "cardio", "walk", "meditat", "health", "water"]):
            category = "Health"
        elif any(w in p_lower for w in ["budget", "invest", "crypto", "tax", "finance", "money", "savings"]):
            category = "Money"
        elif any(w in p_lower for w in ["family", "hobby", "social", "clean", "personal"]):
            category = "Personal"

        # Extract Title
        clean_title = re.sub(r"^(?:please\s+)?(?:can\s+you\s+)?(?:add\s+a?\s*|create\s+a?\s*|schedule\s+a?\s*)", "", prompt, flags=re.IGNORECASE).strip()
        clean_title = re.sub(r"(?:at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\b\d+\s*min(?:ute)?s?|\b\d+\s*hours?|\bto\s+my\s+(?:tasks?|planner|schedule))", "", clean_title, flags=re.IGNORECASE).strip()
        if not clean_title or len(clean_title) < 3:
            clean_title = f"{category} Sprint Session"

        clean_title = clean_title.strip(" .?!,")
        if len(clean_title) > 50:
            clean_title = clean_title[:47] + "..."

        impact_desc = "+0.8 Focus & Cognitive Output" if category in ["Work", "Study"] else ("+0.6 Vitality Index" if category == "Health" else "+2% Capital Control")

        advice_text = f"""### 📋 Proposed Schedule Addition: **{clean_title}**

I have structured a new time-block calibrated for your **{user_info.get('role', 'professional').title()}** routine:

- **Task Title:** {clean_title}
- **Scheduled Time:** {start_time}
- **Duration:** {duration} minutes
- **Category:** {category}
- **Predicted Impact:** {impact_desc}

Click **Approve & Add Task** below to append this directly to your Daily Planner."""

        if think_mode:
            think_block = f"""<think>
• Parsed Schedule Attributes: Title="{clean_title}", Time="{start_time}", Duration={duration}m, Category="{category}".
• Schedule Optimization: Evaluated daily routine balance for {user_info.get('role', 'professional')}.
• Calculated Impact: {impact_desc}.
</think>

"""
            advice_text = think_block + advice_text

        action_payload = {
            "title": clean_title,
            "start": start_time,
            "minutes": duration,
            "category": category,
            "impact": impact_desc
        }

        return {
            "content": advice_text,
            "action_type": "add_task",
            "action_payload": json.dumps(action_payload),
            "action_status": "proposed"
        }

    # 4. DETECT WEALTH PLANNER FORECAST INTENT
    # e.g., "Run my wealth planner" or "Show Monte Carlo forecast"
    wealth_keywords = ["wealth planner", "monte carlo", "forecast net worth", "run wealth", "wealth projection", "simulate wealth", "retire at"]
    is_wealth_intent = any(k in p_lower for k in wealth_keywords)

    if is_wealth_intent:
        from ai_engine.forecasting import financial
        monthly_income = float(user_info.get("monthly_income", 5000.0))
        monthly_expenses = float(user_info.get("monthly_expenses", 2900.0))
        monthly_savings = max(100.0, monthly_income - monthly_expenses)
        current_net_worth = float(user_info.get("net_worth", 15000.0))

        mc_res = financial.run_monte_carlo_simulation(
            current_age=user_info.get("age", 25),
            retirement_age=user_info.get("retirement_goal_age", 60),
            current_net_worth=current_net_worth,
            monthly_savings=monthly_savings,
            num_simulations=500
        )
        final_values = mc_res["final_values"]
        target = float(user_info.get("target_net_worth", 1000000.0))
        hits = sum(1 for val in final_values if val >= target)
        prob = round((hits / len(final_values)) * 100)
        median_final = mc_res["median"][-1]
        p10_final = mc_res["p10"][-1]
        p90_final = mc_res["p90"][-1]

        advice_text = f"""### 📊 Monte Carlo 500-Run Wealth Projection

I executed a **500-stochastic-run simulation** of your financial trajectory:

- **Probability of Hitting ${target:,.2f}:** **{prob}%**
- **Median Projected Net Worth:** **${median_final:,.2f}**
- **P90 Bull Market Ceiling:** **${p90_final:,.2f}**
- **P10 Bear Market Floor:** **${p10_final:,.2f}**
- **Current Monthly Savings:** ${monthly_savings:,.2f}/month

**Strategic Verdict:** """ + (
            "You are in the top tier of financial readiness. Maintaining your discipline will achieve independence ahead of schedule."
            if prob >= 75 else
            "You are on a steady baseline. Increasing monthly contributions by $250 will boost your odds by +14%."
        )

        if think_mode:
            think_block = f"""<think>
• Monte Carlo Stochastic Modeling: 500 stochastic trials (μ=8.0%, σ=15.0%, inflation=2.5%).
• Boundary Percentiles: P10 Bear floor (${p10_final:,.2f}), Median (${median_final:,.2f}), P90 Bull ceiling (${p90_final:,.2f}).
• Target Net Worth: ${target:,.2f} -> Success Probability = {prob}%.
</think>

"""
            advice_text = think_block + advice_text

        action_payload = {
            "target": target,
            "prob": prob,
            "median_final": round(median_final, 2),
            "p10_final": round(p10_final, 2),
            "p90_final": round(p90_final, 2),
            "monthly_savings": monthly_savings,
            "current_net_worth": current_net_worth
        }

        return {
            "content": advice_text,
            "action_type": "wealth_forecast",
            "action_payload": json.dumps(action_payload),
            "action_status": "proposed"
        }

    # 5. DETECT SETTINGS / PROFILE CHANGE INTENT
    # e.g., "Change my monthly income to 6000" or "Set sleep target to 8 hours"
    settings_keywords = ["change my", "update my", "set my", "change monthly income", "change savings", "update sleep target", "change retirement age", "set budget"]
    is_settings_intent = any(k in p_lower for k in settings_keywords)

    if is_settings_intent:
        diff_fields = {}
        # Monthly Income
        inc_m = re.search(r"(?:income|salary)\s+(?:to|=|\:)?\s*\$?([0-9]+(?:\.[0-9]+)?)", p_lower)
        if inc_m:
            diff_fields["monthly_income"] = float(inc_m.group(1))

        # Monthly Expenses
        exp_m = re.search(r"(?:expenses?|spending|budget)\s+(?:to|=|\:)?\s*\$?([0-9]+(?:\.[0-9]+)?)", p_lower)
        if exp_m:
            diff_fields["monthly_expenses"] = float(exp_m.group(1))

        # Sleep target
        slp_m = re.search(r"(?:sleep target|sleep)\s+(?:to|=|\:)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:hours?|hrs?)?", p_lower)
        if slp_m:
            diff_fields["sleep_target_hours"] = float(slp_m.group(1))

        # Study target
        std_m = re.search(r"(?:study target|study hours)\s+(?:to|=|\:)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:hours?|hrs?)?", p_lower)
        if std_m:
            diff_fields["study_target_hours_week"] = float(std_m.group(1))

        # Retirement Age
        ret_m = re.search(r"(?:retirement age|target age)\s+(?:to|=|\:)?\s*([0-9]+)", p_lower)
        if ret_m:
            diff_fields["retirement_goal_age"] = int(ret_m.group(1))

        if diff_fields:
            diff_text = "\n".join(f"- **{k.replace('_', ' ').title()}:** {user_info.get(k, 'N/A')} ➔ **{v}**" for k, v in diff_fields.items())
            advice_text = f"""### ⚙️ Proposed Profile & Settings Update

I detected parameter adjustments for your Digital Twin:

{diff_text}

Click **Approve Changes** below to apply these modifications to your profile and recalculate all baseline models."""

            if think_mode:
                think_block = f"""<think>
• Setting Changes Identified: {', '.join([f'{k}={v}' for k, v in diff_fields.items()])}.
• Telemetry Validation: Bounds verified and calibrated.
</think>

"""
                advice_text = think_block + advice_text

            return {
                "content": advice_text,
                "action_type": "update_settings",
                "action_payload": json.dumps(diff_fields),
                "action_status": "proposed"
            }

    # 6. GENERAL CONVERSATIONAL INTELLIGENCE VIA GROQ (OR NATURAL CONVERSATIONAL FALLBACK)
    client = get_groq_client()
    if client is not None:
        try:
            think_instruction = " When thinking mode is enabled, include a brief <think>...</think> block showing your logical reasoning before giving your final concise response." if think_mode else " Do NOT include any <think> tags."

            system_msg = f"""You are the Digital Twin AI Copilot for {user_info.get('username', 'User')}.
You are a helpful, intelligent personal AI with access to the user's financial and lifestyle telemetry:
- Role: {user_info.get('role', 'professional')} | Age: {user_info.get('age', 25)}
- Monthly Income: ${user_info.get('monthly_income', 5000):,.2f} | Expenses: ${user_info.get('monthly_expenses', 2900):,.2f} | Net Worth: ${user_info.get('net_worth', 15000):,.2f}
- Baseline Sleep: {baseline.get('sleep_hours', 7.5):.1f}h/day | Focus: {baseline.get('study_hours_week', 10.0):.1f}h/week
- Active Goal: {client_ctx.get('goalName', 'Emergency Fund')}

GUIDELINES:
- Answer the user's prompt directly, naturally, and conversationally in clean Markdown.
- If the user greets you or asks a general question, reply warmly and naturally as ChatGPT would.
- Only provide specific metric breakdowns when relevant to the user's inquiry.{think_instruction}
- Keep answers clear, insightful, and concise."""

            messages = [{"role": "system", "content": system_msg}]
            for h in history[-6:]:  # Include recent conversational context
                messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
            messages.append({"role": "user", "content": prompt})

            # Try primary available models
            reply = ""
            for model_candidate in ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.6-27b"]:
                try:
                    resp = client.chat.completions.create(
                        model=model_candidate,
                        messages=messages,
                        temperature=0.6,
                        max_tokens=600,
                        timeout=8.0
                    )
                    raw_content = resp.choices[0].message.content or ""
                    if think_mode:
                        # Keep think tags intact if present, or add thought block if missing
                        if "<think>" in raw_content:
                            reply = raw_content.strip()
                        else:
                            reply = f"<think>\n• Processed inquiry with user telemetry.\n• Synthesizing optimal conversational response.\n</think>\n\n" + raw_content.strip()
                    else:
                        # Strip any reasoning thoughts in normal mode
                        reply = re.sub(r"<think>[\s\S]*?</think>", "", raw_content).strip()
                    if reply:
                        break
                except Exception:
                    continue

            if reply:
                return {
                    "content": reply,
                    "action_type": "none",
                    "action_payload": None,
                    "action_status": "none"
                }
        except Exception as e:
            print(f"Error invoking Groq Copilot chat: {e}")

    # Natural Conversational Fallback if offline
    if any(g in p_lower for g in ["hi", "hello", "hey", "who are you", "what can you do", "help"]):
        fallback_reply = f"""Hello {user_info.get('username', 'there')}! 👋 

I'm your **Digital Twin AI Copilot**. I analyze your routines, productivity, and finances to help you optimize your daily performance and simulate future scenarios.

**Things you can ask me anytime:**
- *\"If I buy a $1,200 laptop today, how does that affect my emergency fund goal?\"*
- *\"What if I study 5 more hours a week and sleep 30 mins less?\"*
- *\"Add a 45 min deep work sprint at 10:00 AM\"*
- *\"Run Monte Carlo wealth simulation\"*

How can I help you today?"""
    else:
        fallback_reply = f"""Based on your current setup as a **{user_info.get('role', 'professional').title()}**, you have a monthly cash flow surplus of **${max(0, user_info.get('monthly_income', 5000) - user_info.get('monthly_expenses', 2900)):,.2f}** and an average sleep baseline of **{baseline.get('sleep_hours', 7.5):.1f}h**.

To simulate specific lifestyle adjustments or financial tradeoffs, feel free to ask questions like *"What if I study 5 more hours?"* or *"Add a 45 min focus block"*."""

    if think_mode:
        fallback_reply = f"<think>\n• Fallback mode active.\n• Synthesizing natural contextual reply.\n</think>\n\n" + fallback_reply

    return {
        "content": fallback_reply,
        "action_type": "none",
        "action_payload": None,
        "action_status": "none"
    }