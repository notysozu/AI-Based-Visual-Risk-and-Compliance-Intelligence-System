import httpx
import os
from typing import Dict, List, Any, Optional

# API Server URL configuration
BACKEND_HOST = os.getenv("BACKEND_HOST", "localhost")
BACKEND_PORT = os.getenv("BACKEND_PORT", "8000")
BASE_URL = f"http://{BACKEND_HOST}:{BACKEND_PORT}"

def get_default_user() -> Dict[str, Any]:
    with httpx.Client(base_url=BASE_URL) as client:
        response = client.get("/users/default")
        response.raise_for_status()
        return response.json()

def update_user(user_id: int, user_update: Dict[str, Any]) -> Dict[str, Any]:
    with httpx.Client(base_url=BASE_URL) as client:
        response = client.put(f"/users/{user_id}", json=user_update)
        response.raise_for_status()
        return response.json()

def get_records(user_id: int, record_type: str, limit: int = 100) -> List[Dict[str, Any]]:
    """
    record_type can be 'financial', 'habit', or 'study'
    """
    with httpx.Client(base_url=BASE_URL) as client:
        response = client.get(f"/records/{record_type}/{user_id}?limit={limit}")
        response.raise_for_status()
        return response.json()

def add_record(user_id: int, record_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    record_type can be 'financial', 'habit', or 'study'
    """
    with httpx.Client(base_url=BASE_URL) as client:
        response = client.post(f"/records/{record_type}/{user_id}", json=data)
        response.raise_for_status()
        return response.json()

def get_baseline_and_correlations(user_id: int) -> Dict[str, Any]:
    with httpx.Client(base_url=BASE_URL) as client:
        response = client.get(f"/simulations/baseline/{user_id}")
        response.raise_for_status()
        return response.json()

def get_forecasts(user_id: int) -> Dict[str, Any]:
    with httpx.Client(base_url=BASE_URL) as client:
        response = client.get(f"/simulations/forecast/{user_id}")
        response.raise_for_status()
        return response.json()

def compare_scenarios(
    user_id: int,
    scenario_a: Dict[str, float],
    scenario_b: Dict[str, float],
    years: int = 5
) -> Dict[str, Any]:
    payload = {
        "scenario_a": scenario_a,
        "scenario_b": scenario_b,
        "years": years
    }
    with httpx.Client(base_url=BASE_URL) as client:
        response = client.post(f"/simulations/compare/{user_id}", json=payload, timeout=30.0)
        response.raise_for_status()
        return response.json()
