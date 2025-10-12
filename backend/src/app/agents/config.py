from __future__ import annotations

from typing import Type

from .interface import AgentInterface
from .openai_agent import OpenAIAgent
from .google_adk_agent import GoogleADKAgent

AGENT_MAPPING: dict[str, Type[AgentInterface]] = {
    "openai-qa": OpenAIAgent,
    "openai-editor": OpenAIAgent,
    "google-adk-qa": GoogleADKAgent,
}
