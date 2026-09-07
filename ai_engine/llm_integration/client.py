import os
import time
from typing import List, Optional
from groq import Groq
from dotenv import load_dotenv

AVAILABLE_GROQ_MODELS: List[str] = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "llama-3.1-70b-versatile",
    "deepseek-r1-distill-llama-70b",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
    "groq/compound",
    "groq/compound-mini",
    "qwen/qwen3.6-27b"
]

_CACHED_MODELS: List[str] = []
_LAST_MODEL_FETCH: float = 0.0


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


def get_active_groq_models(client: Optional[Groq] = None) -> List[str]:
    """
    Return active chat models on the current Groq account with in-memory caching.
    """
    global _CACHED_MODELS, _LAST_MODEL_FETCH
    now = time.time()
    if _CACHED_MODELS and (now - _LAST_MODEL_FETCH < 600):
        return _CACHED_MODELS

    if client is not None:
        try:
            m_list = client.models.list()
            active = [
                m.id for m in m_list.data
                if not any(k in m.id for k in ["whisper", "guard", "orpheus", "allam"])
            ]
            if active:
                # Prioritize high quality models first
                preferred_order = [
                    "openai/gpt-oss-120b",
                    "openai/gpt-oss-20b",
                    "qwen/qwen3.8-27b",
                    "groq/compound",
                    "groq/compound-mini",
                    "qwen/qwen3.6-27b"
                ]
                sorted_active = [m for m in preferred_order if m in active] + [m for m in active if m not in preferred_order]
                _CACHED_MODELS = sorted_active
                _LAST_MODEL_FETCH = now
                return _CACHED_MODELS
        except Exception:
            pass

    return AVAILABLE_GROQ_MODELS
