from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services import file_service, ai_service
from ..services.ai_service import AIServiceError

router = APIRouter()


class ChatBody(BaseModel):
  path: str
  mode: Literal["ask", "edit"]
  message: str
  selection: str | None = None


@router.post("/ai/chat")
def chat(body: ChatBody):
  # Load current content to provide context
  file = file_service.read_file(body.path)
  content = file["content"]

  try:
    if body.mode == "ask":
      res = ai_service.ask(body.path, content, body.message)
      return {"answer": res.answer}
    elif body.mode == "edit":
      res = ai_service.edit(body.path, content, body.message)
      return {"proposedContent": res.proposedContent}
  except AIServiceError as exc:
    raise HTTPException(status_code=500, detail=str(exc))

  raise HTTPException(status_code=400, detail="Invalid mode")
