from __future__ import annotations

import json
import os
from contextlib import aclosing
from typing import AsyncIterator

from google.adk import Agent
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.adk.artifacts.in_memory_artifact_service import (
    InMemoryArtifactService,
)
from google.adk.memory import InMemoryMemoryService
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types as genai_types

from .exceptions import AgentConfigurationError, AgentExecutionError
from .interface import AgentInterface, ChatRequest

_EDIT_INSTRUCTION = (
    "You are an expert Markdown editor. Always return the full updated markdown "
    "inside a single fenced code block labeled 'markdown'. Do not add commentary."
)

_ASK_INSTRUCTION = (
    "You are a helpful technical writer. Answer questions precisely and concisely "
    "based only on the provided markdown content."
)


class GoogleADKAgent(AgentInterface):
    """Agent implementation that delegates to the Google ADK Python SDK."""

    def __init__(self) -> None:
        if any(
            dep is None
            for dep in (
                Agent,
                RunConfig,
                StreamingMode,
                InMemoryArtifactService,
                InMemoryMemoryService,
                InMemorySessionService,
                Runner,
                genai_types,
            )
        ):
            raise AgentConfigurationError(
                "google-adk dependency not installed. "
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

        self._model = os.getenv("GOOGLE_ADK_MODEL", "gemini-2.0-flash")

    async def process_stream(self, request: ChatRequest) -> AsyncIterator[bytes]:
        agent = self._build_agent(request.mode)
        runner = Runner(
            app_name=agent.name,
            agent=agent,
            artifact_service=InMemoryArtifactService(),
            session_service=InMemorySessionService(),
            memory_service=InMemoryMemoryService(),
        )

        session = await runner.session_service.create_session(
            app_name=agent.name,
            user_id="workspace-user",
        )

        user_content = genai_types.Content(
            role="user",
            parts=[genai_types.Part.from_text(text=_build_user_payload(request))],
        )

        run_config = RunConfig(streaming_mode=StreamingMode.SSE)

        collected_text = ""
        final_text = ""

        try:
            async with aclosing(
                runner.run_async(
                    user_id=session.user_id,
                    session_id=session.id,
                    new_message=user_content,
                    run_config=run_config,
                )
            ) as stream:
                async for event in stream:
                    text = _extract_event_text(event)
                    if not text:
                        continue

                    collected_text, delta = _merge_text(collected_text, text)
                    if delta:
                        yield _encode_delta(delta)

                    if not getattr(event, "partial", False):
                        final_text = collected_text
        except Exception as exc:  # pragma: no cover - SDK level errors
            raise AgentExecutionError(
                "Google ADK agent failed to stream a response."
            ) from exc

        final_text = (final_text or collected_text).strip()
        if not final_text:
            raise AgentExecutionError("Google ADK agent returned an empty response.")

        final_key = "proposedContent" if request.mode == "edit" else "answer"
        yield _encode_final(final_key, final_text)

    def _build_agent(self, mode: str) -> Agent:
        if mode == "edit":
            return Agent(
                name="markdown_editor",
                model=self._model,
                instruction=_EDIT_INSTRUCTION,
                description="Edits markdown files with precise updates.",
            )
        return Agent(
            name="markdown_qa",
            model=self._model,
            instruction=_ASK_INSTRUCTION,
            description="Answers questions about markdown content.",
        )


def _build_user_payload(request: ChatRequest) -> str:
    parts = [
        f"File Path: {request.path}",
        f"File Content:\n```markdown\n{request.content}\n```",
        f"User Request: {request.message}",
    ]
    if request.selection:
        parts.append(f"Selection:\n```markdown\n{request.selection}\n```")
    return "\n\n".join(parts)


def _extract_event_text(event: object) -> str:
    content = getattr(event, "content", None)
    if not content:
        return ""
    parts = getattr(content, "parts", None) or []
    texts: list[str] = []
    for part in parts:
        text = getattr(part, "text", None)
        if text:
            texts.append(text)
    return "".join(texts)


def _encode_delta(text: str) -> bytes:
    return (json.dumps({"type": "delta", "text": text}) + "\n").encode("utf-8")


def _encode_final(key: str, text: str) -> bytes:
    return (json.dumps({"type": "final", key: text}) + "\n").encode("utf-8")


def _merge_text(existing: str, incoming: str) -> tuple[str, str]:
    if not incoming:
        return existing, ""
    if not existing:
        return incoming, incoming

    if incoming.startswith(existing):
        return incoming, incoming[len(existing) :]

    max_overlap = min(len(existing), len(incoming))
    for overlap in range(max_overlap, 0, -1):
        if existing.endswith(incoming[:overlap]):
            merged = existing + incoming[overlap:]
            return merged, incoming[overlap:]

    if existing.startswith(incoming):
        return existing, ""

    return existing + incoming, incoming
