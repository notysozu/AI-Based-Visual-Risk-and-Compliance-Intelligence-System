from ai_engine.simulation.simulator import calculate_health_index, calculate_focus_index

h = calculate_health_index(7.5, 30, 4.0)
f = calculate_focus_index(7.5, 2.0, 4.0)
print(f"Health: {h:.1f}, Focus: {f:.1f}")
assert 0 <= h <= 10
assert 0 <= f <= 10
