from __future__ import annotations

import asyncio
import json
import os
from collections.abc import AsyncIterator
from typing import Any

try:
    from google import genai
    from google.genai import types as genai_types
except ImportError:  # pragma: no cover - optional dependency
    genai = None
    genai_types = None

from .exceptions import AgentConfigurationError, AgentExecutionError
from .interface import AgentInterface, ChatRequest


class GoogleADKAgent(AgentInterface):
    """Agent implementation that delegates to Google's GenAI SDK."""

    def __init__(self) -> None:
        if genai is None or genai_types is None:
            raise AgentConfigurationError(
                "google-genai dependency not installed. "
                "Install it to enable the Google ADK agent."
            )

        api_key = (
            os.getenv("GOOGLE_API_KEY")
            or os.getenv("GEMINI_API_KEY")
            or os.getenv("GOOGLE_GENAI_API_KEY")
        )
        if not api_key:
            raise AgentConfigurationError(
                "Google ADK not configured. Provide GOOGLE_API_KEY, GEMINI_API_KEY, "
                "or GOOGLE_GENAI_API_KEY via environment or backend/.env."
            )

        self._client = genai.Client(api_key=api_key)
        self._model = os.getenv("GOOGLE_ADK_MODEL", "models/gemini-2.0-flash")

    async def process_stream(self, request: ChatRequest) -> AsyncIterator[bytes]:
        system_instruction = _system_instruction_for_mode(request.mode)
        user_payload = _build_user_payload(request)

        try:
            response_stream = self._client.responses.stream(
                model=self._model,
                contents=[
                    {
                        "role": "user",
                        "parts": [{"text": user_payload}],
                    }
                ],
                config=genai_types.GenerateContentConfig(
                    system_instruction=system_instruction
                ),
            )
        except Exception as exc:  # pragma: no cover - SDK level errors
            raise AgentExecutionError(
                "Google ADK agent failed to start streaming response."
            ) from exc

        collected: list[str] = []
        async for chunk in _google_stream_to_jsonl(
            response_stream,
            collected,
        ):
            yield chunk

        final_text = "".join(collected).strip()
        if not final_text:
            raise AgentExecutionError("Google ADK agent returned an empty response.")

        final_key = "proposedContent" if request.mode == "edit" else "answer"
        yield (json.dumps({"type": "final", final_key: final_text}) + "\n").encode(
            "utf-8"
        )


def _system_instruction_for_mode(mode: str) -> str:
    if mode == "edit":
        return (
            "You are a precise Markdown editor. Return the fully updated markdown "
            "inside a single fenced code block labeled 'markdown'."
        )
    return "You are a helpful Markdown assistant. Answer concisely using the provided context."


def _build_user_payload(request: ChatRequest) -> str:
    parts = [
        f"File Path: {request.path}",
        f"File Content:\n```markdown\n{request.content}\n```",
        f"User Request: {request.message}",
    ]
    if request.selection:
        parts.append(f"Selection:\n```markdown\n{request.selection}\n```")
    return "\n\n".join(parts)


async def _google_stream_to_jsonl(
    response_stream: Any, collected: list[str]
) -> AsyncIterator[bytes]:
    for event in response_stream:
        text = _extract_text(event)
        if not text:
            continue
        collected.append(text)
        payload = {"type": "delta", "text": text}
        yield (json.dumps(payload) + "\n").encode("utf-8")
        await asyncio.sleep(0)


def _extract_text(event: Any) -> str | None:
    """Best-effort extraction of text content from streaming events."""
    text = getattr(event, "text", None)
    if text:
        return text

    candidates = getattr(event, "candidates", None)
    if not candidates:
        return None

    for candidate in candidates:
        content = getattr(candidate, "content", None)
        if not content:
            continue
        parts = getattr(content, "parts", None) or []
        texts = []
        for part in parts:
            value = getattr(part, "text", None)
            if value:
                texts.append(value)
        if texts:
            return "".join(texts)
    return None
