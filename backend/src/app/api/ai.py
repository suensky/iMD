from __future__ import annotations

import json
import logging
from typing import Literal

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..services import file_service, ai_service
from ..services.ai_service import AIServiceError

router = APIRouter()
# Use uvicorn.error logger so INFO statements surface with the default run-backend command.
logger = logging.getLogger("uvicorn.error").getChild(__name__)


class ChatBody(BaseModel):
  path: str
  mode: Literal["ask", "edit"]
  message: str
  selection: str | None = None


def _preview(text: str, limit: int = 120) -> str:
  sanitized = text.replace("\n", "\\n")
  if len(sanitized) <= limit:
    return sanitized
  return f"{sanitized[:limit]}..."


@router.post("/ai/chat")
async def chat(body: ChatBody):
  logger.info(
      "Received AI chat request path=%s mode=%s message_len=%d selection_present=%s",
      body.path,
      body.mode,
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

  if body.mode not in {"ask", "edit"}:
    logger.warning(
        "Invalid AI chat mode received path=%s mode=%s",
        body.path,
        body.mode,
    )
    raise HTTPException(status_code=400, detail="Invalid mode")

  async def _event_stream():
    try:
      if body.mode == "ask":
        stream = ai_service.ask(body.path, content, body.message)
      else:
        stream = ai_service.edit(body.path, content, body.message)

      async for chunk in stream:
        if chunk.type == "delta":
          payload = {"type": "delta", "text": chunk.text}
        else:
          if body.mode == "ask":
            logger.info(
                "AI ask result path=%s answer_preview=%s",
                body.path,
                _preview(chunk.text),
            )
            payload = {"type": "final", "answer": chunk.text}
          else:
            logger.info(
                "AI edit result path=%s proposed_len=%d preview=%s",
                body.path,
                len(chunk.text),
                _preview(chunk.text),
            )
            payload = {"type": "final", "proposedContent": chunk.text}

        yield (json.dumps(payload) + "\n").encode("utf-8")
    except AIServiceError as exc:
      logger.exception(
          "AI service error path=%s mode=%s",
          body.path,
          body.mode,
      )
      raise HTTPException(status_code=500, detail=str(exc))

  return StreamingResponse(_event_stream(), media_type="application/jsonl")
