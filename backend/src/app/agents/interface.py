from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from typing import Literal

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Unified request payload passed to concrete agent implementations."""

    path: str = Field(..., description="Path of the markdown file in the workspace.")
    content: str = Field(..., description="Full markdown content for context.")
    message: str = Field(..., description="User prompt or instruction.")
    mode: Literal["ask", "edit"] = Field(
        "ask", description="Operation mode that influences prompts and post-processing."
    )
    agent_id: str = Field(
        "openai-qa",
        description="Identifier mapping to a concrete agent implementation.",
    )
    selection: str | None = Field(
        None,
        description="Optional selection of the file content provided by the client.",
    )


class AgentInterface(ABC):
    """Strategy interface for agent providers."""

    @abstractmethod
    async def process_stream(self, request: ChatRequest) -> AsyncIterator[bytes]:
        """Stream newline-delimited JSON chunks encoded as bytes."""
        raise NotImplementedError
