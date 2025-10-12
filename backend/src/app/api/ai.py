from __future__ import annotations

import logging
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..agents import AgentRouterService, ChatRequest, agent_router_service
from ..agents.exceptions import AgentError, AgentNotFoundError
from ..services import file_service

router = APIRouter()
# Use uvicorn.error logger so INFO statements surface with the default run-backend command.
logger = logging.getLogger("uvicorn.error").getChild(__name__)


class ChatBody(BaseModel):
  path: str
  mode: Literal["ask", "edit"] = "ask"
  message: str
  agent_id: str = "openai-qa"
  selection: str | None = None


@router.post("/ai/chat")
async def chat(
    body: ChatBody,
    router_service: AgentRouterService = Depends(lambda: agent_router_service),
) -> StreamingResponse:
  logger.info(
      "Received AI chat request path=%s mode=%s agent_id=%s message_len=%d selection_present=%s",
      body.path,
      body.mode,
      body.agent_id,
      len(body.message),
      body.selection is not None,
  )

  # Load current content to provide context
  file = file_service.read_file(body.path)
  content = file["content"]
  logger.debug(
      "Loaded file content path=%s content_len=%d",
      body.path,
      len(content),
  )

  chat_request = ChatRequest(
      path=body.path,
      content=content,
      message=body.message,
      mode=body.mode,
      agent_id=body.agent_id,
      selection=body.selection,
  )

  if body.mode not in {"ask", "edit"}:
    logger.warning(
        "Invalid AI chat mode received path=%s mode=%s agent_id=%s",
        body.path,
        body.mode,
        body.agent_id,
    )
    raise HTTPException(status_code=400, detail="Invalid mode")

  try:
    response = router_service.route_request(chat_request)
  except AgentNotFoundError as exc:
    logger.warning(
        "Unknown agent requested path=%s agent_id=%s",
        body.path,
        body.agent_id,
    )
    raise HTTPException(status_code=400, detail=str(exc))
  except AgentError as exc:
    logger.exception(
        "Agent error path=%s mode=%s agent_id=%s",
        body.path,
        body.mode,
        body.agent_id,
    )
    raise HTTPException(status_code=500, detail=str(exc))

  return response
