

import os
import re
import json
from groq import Groq
from typing import Dict, Any, List, Optional

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = None
if GROQ_API_KEY:
    try:
        client = Groq(api_key=GROQ_API_KEY)
    except Exception as e:
        print(f"Error initializing Groq client: {e}")


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

    advice = "### 🤖 Digital Twin Rule-Based Verdict\n\n"
    advice += "*(Note: Run with a valid GROQ_API_KEY to enable full conversational intelligence.)*\n\n"

    advice += "#### **Analysis of Scenario A**\n"
    advice += f"- **Lifestyle changes:** Sleep: {sa['details']['sleep']:.1f} hrs, Study: {sa['details']['study_week']:.1f} hrs/week, Monthly Savings: ${sa['details']['monthly_savings']:.2f}.\n"
    advice += f"- **Wellbeing & Performance:** Health Index: {sa['health_index']:.1f}/10, Focus Rating: {sa['focus_index']:.1f}/10.\n"
    advice += f"- **Financial Projection:** Net Worth in 5 years: ${sa['wealth_at_end']:,.2f}. "
    if sa["attained_retirement"]:
        advice += "On track to reach retirement goals! 🎯\n"
    else:
        advice += f"Projected retirement wealth of ${sa['retirement_wealth']:,.2f} falls short of target (${user_info['target_net_worth']:,.2f}).\n"

    advice += "\n#### **Analysis of Scenario B**\n"
    advice += f"- **Lifestyle changes:** Sleep: {sb['details']['sleep']:.1f} hrs, Study: {sb['details']['study_week']:.1f} hrs/week, Monthly Savings: ${sb['details']['monthly_savings']:.2f}.\n"
    advice += f"- **Wellbeing & Performance:** Health Index: {sb['health_index']:.1f}/10, Focus Rating: {sb['focus_index']:.1f}/10.\n"
    advice += f"- **Financial Projection:** Net Worth in 5 years: ${sb['wealth_at_end']:,.2f}. "
    if sb["attained_retirement"]:
        advice += "On track to reach retirement goals! 🎯\n"
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
        advice += "💡 **Recommendation:** **Choose Scenario B.** Scenario A degrades your health index below a sustainable baseline. Short-term financial or study gains do not justify the cognitive toll of sleep deprivation.\n"
    elif sb['health_index'] < 5.0 and sa['health_index'] >= 5.0:
        advice += "💡 **Recommendation:** **Choose Scenario A.** Scenario B degrades your health index below a sustainable baseline due to sleep or habits neglect.\n"
    elif sb['wealth_at_end'] > sa['wealth_at_end'] and sb['health_index'] >= sa['health_index'] - 0.5:
        advice += "💡 **Recommendation:** **Choose Scenario B.** It provides superior financial growth without significantly damaging your lifestyle and health parameters.\n"
    else:
        advice += "💡 **Recommendation:** **Choose Scenario A.** It balances financial safety and performance score with sustainable health metrics.\n"

    return advice


def generate_digital_twin_advice(
    user_info: Dict[str, Any],
    baseline: Dict[str, Any],
    sim_results: Dict[str, Any]
) -> str:
    """
    Generate conversational recommendations using Groq (Llama 3.1), or fallback to rule-based logic.
    """
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
            temperature=0.4,
            max_tokens=800,
        )
        return response.choices[0].message.content

    except Exception as e:
        print(f"Error calling Groq API: {e}. Falling back to rule-based advice.")
        return get_rule_based_advice(user_info, baseline, sim_results)


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

    def set_context(self, user_profile: dict, financial_summary: dict,
                     study_summary: dict, habits: list, goals: list):
        """Call this once per session (or after data refresh) with data
        gathered from forecasting/simulation modules + database layer."""
        self.system_prompt = build_system_prompt(
            user_profile, financial_summary, study_summary, habits, goals
        )

    def ask(self, user_message: str) -> str:
        if self.system_prompt is None:
            raise ValueError("Call set_context() before ask().")

        if client is None:
            return "Groq AI Advisor is offline. Please configure a valid GROQ_API_KEY in your environment to enable conversational recommendations."

        messages = [{"role": "system", "content": self.system_prompt}]
        for t in self.history:
            messages.append({"role": t["role"], "content": t["text"]})
        messages.append({"role": "user", "content": user_message})

        response = client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.4,
            max_tokens=800,
        )

        reply = response.choices[0].message.content
        self.history.append({"role": "user", "text": user_message})
        self.history.append({"role": "assistant", "text": reply})
        return reply

    def ask_with_simulation(self, user_message: str, scenario_result: dict) -> str:
        """Use when the user asks about a specific simulated scenario
        (output of ai_engine/simulation/simulator.py)."""
        scenario_context = (
            f"\n\nSIMULATION RESULT FOR THIS QUERY:\n"
            f"Scenario: {scenario_result.get('scenario_name')}\n"
            f"Predicted Outcome: {scenario_result.get('predicted_outcome')}\n"
        )
        return self.ask(user_message + scenario_context)



def get_rule_based_wealth_advice(
    user_info: Dict[str, Any],
    baseline: Dict[str, Any],
    forecast_summary: Dict[str, Any]
) -> str:
    """
    Fallback rule-based wealth prediction when no Groq API key is configured.
    """
    prob = forecast_summary["probability_of_success"] * 100
    advice = "### 🤖 Digital Twin Rule-Based Wealth Prediction\n\n"
    advice += "*(Note: Run with a valid GROQ_API_KEY to enable full conversational intelligence.)*\n\n"
    advice += f"- **Current savings pace:** ${baseline['monthly_savings']:,.2f}/month\n"
    advice += f"- **Deterministic projection:** ${forecast_summary['deterministic_final']:,.2f} by target age\n"
    advice += f"- **Monte Carlo median outcome:** ${forecast_summary['monte_carlo_median_final']:,.2f}\n"
    advice += f"- **Probability of hitting your target:** {prob:.0f}%\n\n"
    if prob >= 70:
        advice += "💡 **Prediction:** You're on a strong trajectory. Staying consistent with your current savings rate is likely enough to hit your goal.\n"
    elif prob >= 40:
        advice += "💡 **Prediction:** You're on a moderate trajectory. A modest increase in monthly savings would meaningfully improve your odds.\n"
    else:
        advice += "💡 **Prediction:** Your current pace is unlikely to reach your target. Consider increasing monthly contributions or adjusting your target timeline.\n"
    return advice


def generate_wealth_advice(
    user_info: Dict[str, Any],
    baseline: Dict[str, Any],
    forecast_summary: Dict[str, Any]
) -> str:
    """
    Generate a conversational wealth prediction using Groq, or fallback to rule-based logic.
    forecast_summary expects: deterministic_final, monte_carlo_median_final,
    monte_carlo_p10_final, monte_carlo_p90_final, probability_of_success, years.
    """
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
            temperature=0.4,
            max_tokens=400,
        )
        return response.choices[0].message.content

    except Exception as e:
        print(f"Error calling Groq API: {e}. Falling back to rule-based advice.")
        return get_rule_based_wealth_advice(user_info, baseline, forecast_summary)


import json

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

    if client is None:
        return fallback_summary

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=300,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error generating analytics summary: {e}")
        return fallback_summary


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