import os
from typing import List, Optional
from groq import Groq
from dotenv import load_dotenv

AVAILABLE_GROQ_MODELS: List[str] = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.6-27b",
    "groq/compound"
]


def get_groq_client() -> Optional[Groq]:
    """
    Instantiate and return a Groq client.
    Reloads environment dynamically so that changes to .env take effect immediately.
    """
    load_dotenv(override=True)
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    try:
        return Groq(api_key=api_key)
    except Exception as e:
        print(f"Error initializing Groq client: {e}")
        return None
