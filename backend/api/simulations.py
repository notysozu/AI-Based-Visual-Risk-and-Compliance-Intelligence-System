
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import database, crud
from ai_engine.simulation import simulator
from ai_engine.forecasting import financial, habits
from backend.services.llm_service import LLMService
from ai_engine.llm_integration.advisor import generate_wealth_advice, generate_scenario_suggestions, generate_analytics_summary
from database import schemas
from typing import Dict, Any

router = APIRouter(prefix="/simulations", tags=["simulations"])

@router.get("/baseline/{user_id}")
def get_baseline(user_id: int, db: Session = Depends(database.get_db)):
    """
    Get 30-day baseline statistics and habit correlations.
    """
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    baseline = simulator.get_user_baseline_metrics(db, user_id)
    corr_data = habits.analyze_habits_correlation(db, user_id)
    
    return {
        "baseline": baseline,
        "correlations": corr_data.get("correlations", {}),
        "sample_size": corr_data.get("sample_size", 0)
    }

@router.get("/forecast/{user_id}")
def get_forecasts(user_id: int, db: Session = Depends(database.get_db)):
    """
    Get deterministic net worth growth projections and Monte Carlo simulations.
    """
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    baseline = simulator.get_user_baseline_metrics(db, user_id)
    
    # 1. Deterministic Projection to retirement age
    det_proj = financial.run_deterministic_projection(
        current_age=user.age,
        retirement_age=user.retirement_goal_age,
        current_net_worth=baseline["current_net_worth"],
        monthly_savings=baseline["monthly_savings"],
        annual_return_rate=0.08,
        annual_inflation_rate=0.025
    )
    
    # 2. Monte Carlo Projection
    mc_proj = financial.run_monte_carlo_simulation(
        current_age=user.age,
        retirement_age=user.retirement_goal_age,
        current_net_worth=baseline["current_net_worth"],
        monthly_savings=baseline["monthly_savings"],
        mean_return=0.08,
        std_dev=0.15,
        annual_inflation_rate=0.025,
        num_simulations=500
    )
    
    # Compute probability of hitting target net worth
    final_values = mc_proj["final_values"]
    hits = sum(1 for val in final_values if val >= user.target_net_worth)
    prob_success = float(hits) / len(final_values)
    
    return {
        "deterministic": det_proj,
        "monte_carlo": {
            "years": mc_proj["years"],
            "ages": mc_proj["ages"],
            "median": mc_proj["median"],
            "p10": mc_proj["p10"],
            "p90": mc_proj["p90"]
        },
        "probability_of_success": prob_success
    }

@router.get("/wealth-advice/{user_id}")
def get_wealth_advice(user_id: int, db: Session = Depends(database.get_db)):
    """
    Get an AI-generated prediction/narrative interpreting the Monte Carlo
    and deterministic forecasts for this user. The underlying numbers are
    still computed statistically (same as /forecast) — Groq is used only
    to interpret and explain them in plain language, not to generate them.
    If the success probability remains the same, cached advice is returned immediately.
    """
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    baseline = simulator.get_user_baseline_metrics(db, user_id)

    det_proj = financial.run_deterministic_projection(
        current_age=user.age,
        retirement_age=user.retirement_goal_age,
        current_net_worth=baseline["current_net_worth"],
        monthly_savings=baseline["monthly_savings"],
        annual_return_rate=0.08,
        annual_inflation_rate=0.025
    )

    mc_proj = financial.run_monte_carlo_simulation(
        current_age=user.age,
        retirement_age=user.retirement_goal_age,
        current_net_worth=baseline["current_net_worth"],
        monthly_savings=baseline["monthly_savings"],
        mean_return=0.08,
        std_dev=0.15,
        annual_inflation_rate=0.025,
        num_simulations=500
    )

    final_values = mc_proj["final_values"]
    hits = sum(1 for val in final_values if val >= user.target_net_worth)
    prob_success = float(hits) / len(final_values)
    rounded_odds = round(prob_success, 2)

    # Check if success odds are the same and we have cached advice
    if user.last_success_odds is not None and abs(user.last_success_odds - rounded_odds) < 0.001 and user.last_wealth_prediction:
        return {
            "advice": user.last_wealth_prediction,
            "probability_of_success": prob_success,
        }

    user_info = {
        "username": user.username,
        "role": getattr(user, "role", "professional") or "professional",
        "age": user.age,
        "retirement_goal_age": user.retirement_goal_age,
        "target_net_worth": user.target_net_worth,
        "monthly_income": user.monthly_income
    }

    forecast_summary = {
        "deterministic_final": det_proj[-1]["net_worth"] if det_proj else 0,
        "monte_carlo_median_final": mc_proj["median"][-1] if mc_proj["median"] else 0,
        "monte_carlo_p10_final": mc_proj["p10"][-1] if mc_proj["p10"] else 0,
        "monte_carlo_p90_final": mc_proj["p90"][-1] if mc_proj["p90"] else 0,
        "probability_of_success": prob_success,
        "years": mc_proj["years"],
    }

    advice = generate_wealth_advice(user_info, baseline, forecast_summary)

    # Save to user database record
    user.last_success_odds = rounded_odds
    user.last_wealth_prediction = advice
    db.commit()

    return {
        "advice": advice,
        "probability_of_success": prob_success,
    }

@router.get("/suggest/{user_id}")
def get_scenario_suggestions(user_id: int, db: Session = Depends(database.get_db)):
    """
    Get AI-generated suggestions for Scenario A and Scenario B sliders.
    """
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    baseline = simulator.get_user_baseline_metrics(db, user_id)
    
    user_info = {
        "username": user.username,
        "role": getattr(user, "role", "professional") or "professional",
        "age": user.age,
        "retirement_goal_age": user.retirement_goal_age,
        "target_net_worth": user.target_net_worth,
        "monthly_income": user.monthly_income
    }
    
    suggestions = generate_scenario_suggestions(user_info, baseline)
    return suggestions

@router.post("/compare/{user_id}", response_model=schemas.SimulationResponse)
def compare_scenarios(user_id: int, payload: schemas.SimulationRequest, db: Session = Depends(database.get_db)):
    """
    Compare Scenario A and Scenario B side-by-side and fetch LLM advisor analysis.
    """
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    baseline = simulator.get_user_baseline_metrics(db, user_id)
    
    change_a = payload.scenario_a.model_dump()
    change_b = payload.scenario_b.model_dump()
    
    # Run the simulator engine
    sim_outputs = simulator.run_what_if_comparison(
        db=db,
        user_id=user_id,
        change_a=change_a,
        change_b=change_b,
        years=payload.years
    )
    
    # Get conversational advice from LLM
    user_info = {
        "username": user.username,
        "role": getattr(user, "role", "professional") or "professional",
        "age": user.age,
        "retirement_goal_age": user.retirement_goal_age,
        "target_net_worth": user.target_net_worth,
        "monthly_income": user.monthly_income
    }
    
    advice_text = LLMService.get_advice(user_info, baseline, sim_outputs)
    
    # Map back to response schemas
    # Note: we need to wrap the response structure as defined in schemas.py
    
    def map_to_result(name: str, out: Dict[str, Any]) -> schemas.SimulationResult:
        datapoints = []
        for dp in out["datapoints"]:
            datapoints.append(schemas.Datapoint(
                year=dp["year"],
                net_worth=dp["net_worth"],
                health_index=dp["health_index"],
                focus_index=dp["focus_index"]
            ))
        return schemas.SimulationResult(
            scenario_name=out["scenario_name"],
            datapoints=datapoints,
            attained_retirement=out["attained_retirement"],
            wealth_at_end=out["wealth_at_end"]
        )
        
    return schemas.SimulationResponse(
        scenario_a=map_to_result("scenario_a", sim_outputs["scenario_a"]),
        scenario_b=map_to_result("scenario_b", sim_outputs["scenario_b"]),
        recommendation=advice_text
    )

@router.post("/analytics-summary/{user_id}")
def get_analytics_summary(user_id: int, payload: schemas.AnalyticsSummaryRequest, db: Session = Depends(database.get_db)):
    """
    Get AI-generated readable overview of daily logs.
    """
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_info = {
        "username": user.username,
        "role": getattr(user, "role", "professional") or "professional",
        "age": user.age,
        "retirement_goal_age": user.retirement_goal_age,
        "target_net_worth": user.target_net_worth,
        "monthly_income": user.monthly_income
    }
    
    # Convert payload logs schema list to dict list
    log_dicts = [item.model_dump() for item in payload.logs]
    
    summary = generate_analytics_summary(user_info, log_dicts)
    return {"summary": summary}