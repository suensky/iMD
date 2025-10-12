from __future__ import annotations

from typing import Type

from fastapi.responses import StreamingResponse

from .config import AGENT_MAPPING
from .exceptions import AgentNotFoundError
from .interface import AgentInterface, ChatRequest


class AgentRouterService:
    """Routes chat requests to the configured agent implementation."""

    def __init__(self, registry: dict[str, Type[AgentInterface]] | None = None) -> None:
        self._registry: dict[str, Type[AgentInterface]] = registry or AGENT_MAPPING

    def get_agent_instance(self, agent_id: str) -> AgentInterface:
        agent_cls = self._registry.get(agent_id)
        if agent_cls is None:
            raise AgentNotFoundError(
                f"Unknown agent_id '{agent_id}'. Available agents: {list(self._registry)}"
            )
        return agent_cls()

    def route_request(self, request: ChatRequest) -> StreamingResponse:
        agent = self.get_agent_instance(request.agent_id)
        stream = agent.process_stream(request)
        return StreamingResponse(stream, media_type="application/jsonl")


agent_router_service = AgentRouterService()
