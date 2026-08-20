from ai_engine.llm_integration.advisor import get_rule_based_wealth_advice

summary = {
    'deterministic_final': 1500000,
    'monte_carlo_median_final': 1600000,
    'probability_of_success': 0.85
}
user_info = {'role': 'professional'}
baseline = {'monthly_savings': 1000}
adv = get_rule_based_wealth_advice(user_info, baseline, summary)
print("Advisor fallback preview:", adv[:100])
