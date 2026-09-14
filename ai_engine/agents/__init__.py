"""
Multi-Agent Orchestration Layer for Visual Risk AI Copilot.

Provides specialized sub-agents that directly execute MongoDB mutations
when users issue natural-language commands in chat.
"""

from .router import route_to_agents

__all__ = ["route_to_agents"]
