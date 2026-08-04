from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import database, crud
from ai_engine.simulation import simulator
from ai_engine.forecasting import financial, habits
# from backend.services.llm_service import LLMService
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
    Get financial forecasting summary using the current AI forecasting module.
    """
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch financial records for the user
    records = crud.get_financial_records(db, user_id)

    financial_records = []
    current_savings = 0.0

    for r in records:
        financial_records.append({
            "income": r.amount if r.category.lower() == "income" else 0,
            "expenses": r.amount if r.category.lower() != "income" else 0,
            "transaction_date": str(r.record_date)
        })

        if r.category.lower() == "investment":
            current_savings += r.amount

    summary = financial.build_financial_summary(
        records=financial_records,
        current_savings=current_savings,
        annual_growth_rate=0.08
    )

    months_to_goal = financial.project_toward_goal(
        current_savings=summary["current_savings"],
        monthly_savings=summary["projected_savings_1y"] / 12,
        target_value=user.target_net_worth,
        annual_growth_rate=0.08
    )

    return {
        "financial_summary": summary,
        "months_to_goal": months_to_goal
    }

@router.post("/compare/{user_id}", response_model=schemas.SimulationResponse)
def compare_scenarios(
    user_id: int,
    payload: schemas.SimulationRequest,
    db: Session = Depends(database.get_db)
):
    """
    Compare Scenario A and Scenario B.
    LLM advisor temporarily disabled.
    """

    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    baseline = simulator.get_user_baseline_metrics(db, user_id)

    change_a = payload.scenario_a.model_dump()
    change_b = payload.scenario_b.model_dump()

    sim_outputs = simulator.run_what_if_comparison(
        db=db,
        user_id=user_id,
        change_a=change_a,
        change_b=change_b,
        years=payload.years
    )

    # Temporary replacement for LLM recommendation
    advice_text = (
        "Simulation completed successfully. "
        "LLM-based recommendation will be enabled after advisor integration."
    )

    def map_to_result(name: str, out: Dict[str, Any]) -> schemas.SimulationResult:
        datapoints = []

        for dp in out["datapoints"]:
            datapoints.append(
                schemas.Datapoint(
                    year=dp["year"],
                    net_worth=dp["net_worth"],
                    health_index=dp["health_index"],
                    focus_index=dp["focus_index"]
                )
            )

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