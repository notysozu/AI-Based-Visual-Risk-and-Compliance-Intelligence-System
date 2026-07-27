from ai_engine.llm_integration.advisor import generate_digital_twin_advice
from typing import Dict, Any

class LLMService:
    @staticmethod
    def get_advice(user_info: Dict[str, Any], baseline: Dict[str, Any], sim_results: Dict[str, Any]) -> str:
        """
        Wrapper service that requests conversational analysis of simulation results.
        """
        return generate_digital_twin_advice(user_info, baseline, sim_results)
