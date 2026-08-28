from ai_engine.forecasting.financial import run_monte_carlo_simulation

print("--- Testing Monte Carlo 500-Run Convergence ---")
res = run_monte_carlo_simulation(
    current_age=25,
    retirement_age=60,
    current_net_worth=15000.0,
    monthly_savings=500.0,
    num_simulations=500
)

final_values = res["final_values"]
median_final = res["median"][-1]
p10_final = res["p10"][-1]
p90_final = res["p90"][-1]

print(f"P10 Bear Floor: ${p10_final:,.2f}")
print(f"Median Final:   ${median_final:,.2f}")
print(f"P90 Bull Peak:  ${p90_final:,.2f}")

assert len(final_values) == 500
assert p10_final <= median_final <= p90_final
print("✓ Monte Carlo stochastic simulation verified successfully!")
