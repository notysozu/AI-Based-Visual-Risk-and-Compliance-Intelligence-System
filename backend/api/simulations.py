from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import database, crud
from ai_engine.simulation import simulator
from ai_engine.forecasting import financial, habits
from backend.services.llm_service import LLMService
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
