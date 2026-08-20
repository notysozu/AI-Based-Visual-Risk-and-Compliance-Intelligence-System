from ai_engine.forecasting.financial import run_monte_carlo_simulation

res = run_monte_carlo_simulation(25, 60, 15000, 500, 1000000, 100)
print(f"MC success probability: {res.get('probability_of_success')}")
