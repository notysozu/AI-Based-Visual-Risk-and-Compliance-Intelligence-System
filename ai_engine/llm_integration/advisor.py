import os
import google.generativeai as genai
from typing import Dict, Any

def get_rule_based_advice(
    user_info: Dict[str, Any],
    baseline: Dict[str, Any],
    sim_results: Dict[str, Any]
) -> str:
    """
    Fallback high-quality rule-based advisor when no Gemini API key is configured.
    """
    sa = sim_results["scenario_a"]
    sb = sim_results["scenario_b"]
    
    advice = "### 🤖 Digital Twin Rule-Based Verdict\n\n"
    advice += "*(Note: Run with a valid LLM_API_KEY to enable full conversational intelligence.)*\n\n"
    
    # Analyze Scenario A
    advice += "#### **Analysis of Scenario A**\n"
    advice += f"- **Lifestyle changes:** Sleep: {sa['details']['sleep']:.1f} hrs, Study: {sa['details']['study_week']:.1f} hrs/week, Monthly Savings: ${sa['details']['monthly_savings']:.2f}.\n"
    advice += f"- **Wellbeing & Performance:** Health Index: {sa['health_index']:.1f}/10, Focus Rating: {sa['focus_index']:.1f}/10.\n"
    advice += f"- **Financial Projection:** Net Worth in 5 years: ${sa['wealth_at_end']:,.2f}. "
    if sa["attained_retirement"]:
        advice += "On track to reach retirement goals! 🎯\n"
    else:
        advice += f"Projected retirement wealth of ${sa['retirement_wealth']:,.2f} falls short of target (${user_info['target_net_worth']:,.2f}).\n"
        
    # Analyze Scenario B
    advice += "\n#### **Analysis of Scenario B**\n"
    advice += f"- **Lifestyle changes:** Sleep: {sb['details']['sleep']:.1f} hrs, Study: {sb['details']['study_week']:.1f} hrs/week, Monthly Savings: ${sb['details']['monthly_savings']:.2f}.\n"
    advice += f"- **Wellbeing & Performance:** Health Index: {sb['health_index']:.1f}/10, Focus Rating: {sb['focus_index']:.1f}/10.\n"
    advice += f"- **Financial Projection:** Net Worth in 5 years: ${sb['wealth_at_end']:,.2f}. "
    if sb["attained_retirement"]:
        advice += "On track to reach retirement goals! 🎯\n"
    else:
        advice += f"Projected retirement wealth of ${sb['retirement_wealth']:,.2f} falls short of target (${user_info['target_net_worth']:,.2f}).\n"
        
    # Compare
    advice += "\n#### **Tradeoff Analysis & Verdict**\n"
    
    # 1. Health Tradeoff
    sleep_diff = sb['details']['sleep'] - sa['details']['sleep']
    if sleep_diff > 0.5:
        advice += f"- **Health:** Scenario B prioritizes sleep by {sleep_diff:.1f} additional hours, yielding a better Health Index of **{sb['health_index']:.1f}/10** compared to Scenario A (**{sa['health_index']:.1f}/10**). Rest is critical for avoiding long-term cognitive burnout.\n"
    elif sleep_diff < -0.5:
        advice += f"- **Health:** Scenario A prioritizes sleep by {abs(sleep_diff):.1f} additional hours, yielding a better Health Index of **{sa['health_index']:.1f}/10** compared to Scenario B (**{sb['health_index']:.1f}/10**). Avoid cutting sleep short to hit financial targets.\n"
    else:
        advice += "- **Health:** Both scenarios maintain similar sleeping patterns.\n"
        
    # 2. Study Tradeoff
    study_diff = sb['details']['study_week'] - sa['details']['study_week']
    if study_diff > 1.0:
        advice += f"- **Studies:** Scenario B increases weekly study by {study_diff:.1f} hours, boosting focus performance to **{sb['focus_index']:.1f}/10**. This represents a strong commitment to learning and career pivoting.\n"
    elif study_diff < -1.0:
        advice += f"- **Studies:** Scenario A increases weekly study by {abs(study_diff):.1f} hours, boosting focus performance to **{sa['focus_index']:.1f}/10**.\n"
        
    # 3. Financial Tradeoff
    sav_diff = sb['details']['monthly_savings'] - sa['details']['monthly_savings']
    if sav_diff > 100:
        advice += f"- **Finances:** Scenario B saves ${sav_diff:,.2f} more monthly, leading to an extra ${sb['wealth_at_end'] - sa['wealth_at_end']:,.2f} in assets over the timeline. This accelerates compounding interest significantly.\n"
    elif sav_diff < -100:
        advice += f"- **Finances:** Scenario A saves ${abs(sav_diff):,.2f} more monthly, leading to an extra ${sa['wealth_at_end'] - sb['wealth_at_end']:,.2f} in assets over the timeline.\n"

    # Verdict
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
    Generate conversational recommendations using Gemini API, or fallback to rule-based logic.
    """
    api_key = os.getenv("LLM_API_KEY")
    
    # Fallback to rule-based advisor if no API key or placeholder
    if not api_key or "your_api_key" in api_key or api_key == "":
        return get_rule_based_advice(user_info, baseline, sim_results)
        
    try:
        genai.configure(api_key=api_key)
        # Using a reliable generative model
        model = genai.GenerativeModel("gemini-1.5-flash")
        
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
        response = model.generate_content(prompt)
        return response.text
        
    except Exception as e:
        print(f"Error calling Gemini API: {e}. Falling back to rule-based advice.")
        return get_rule_based_advice(user_info, baseline, sim_results)
