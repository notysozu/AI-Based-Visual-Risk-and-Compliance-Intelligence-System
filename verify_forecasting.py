"""verify_forecasting.py — run from project root"""
import asyncio
from database.database import init_mongodb
from ai_engine.forecasting import financial, habits, study

async def check_user(user_id: int):
    await init_mongodb()
    print(f"\n{'='*50}\nCHECKING USER {user_id}\n{'='*50}")

    fin = await financial.get_financial_summary(user_id)
    print("\n[financial.py] get_financial_summary:")
    print(fin)

    coefs, is_fallback = await habits.fit_digital_twin_models(user_id)
    print("\n[habits.py] fit_digital_twin_models:")
    print("  is_fallback:", is_fallback, "| coefs:", coefs)

    scores_good = habits.predict_scenario_scores(coefs, sleep_hours=8, exercise_hours=1, screen_hours=2, social_hours=1, study_hours=2)
    scores_bad = habits.predict_scenario_scores(coefs, sleep_hours=4, exercise_hours=0, screen_hours=10, social_hours=0, study_hours=0.5)
    print("  Healthy scenario:", scores_good)
    print("  Unhealthy scenario:", scores_bad)
    if scores_good["health_index"] <= scores_bad["health_index"]:
        print("  WARNING: Direction looks inverted — check impact_score coding")
    else:
        print("  PASS: direction makes sense")

    study_summary = await study.get_study_summary(user_id)
    print("\n[study.py] get_study_summary:")
    print(study_summary)

if __name__ == "__main__":
    asyncio.run(check_user(user_id=1))