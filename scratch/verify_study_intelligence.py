from ai_engine.forecasting.study import calculate_retention_score

score = calculate_retention_score([])
print(f"Default retention score: {score}")
assert score == 75
