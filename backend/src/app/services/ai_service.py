from __future__ import annotations

import os
import re
from collections.abc import AsyncIterator
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Literal, Optional

from dotenv import load_dotenv

from agents import (
    Agent,
    ModelSettings,
    Runner,
    set_default_openai_client,
    set_default_openai_key,
)
from agents.exceptions import AgentsException
from openai import AsyncOpenAI
from openai.types.responses import ResponseTextDeltaEvent
from agents.stream_events import RawResponsesStreamEvent


class AIServiceError(RuntimeError):
    """Raised when the AI backend cannot fulfill a request."""


@dataclass(frozen=True)
class _AISettings:
    api_key: str
    model: str
    base_url: Optional[str] = None


@lru_cache(maxsize=1)
def _load_backend_env() -> None:
    """Ensure backend/.env is loaded after checking the process env."""
    if os.getenv("OPENAI_API_KEY"):
        return
    env_path = Path(__file__).resolve().parents[3] / ".env"
    if env_path.is_file():
        load_dotenv(env_path, override=False)


@lru_cache(maxsize=1)
def _get_settings() -> _AISettings:
    _load_backend_env()
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise AIServiceError(
            "OpenAI not configured. Provide OPENAI_API_KEY via environment or backend/.env."
        )
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    base_url = os.getenv("OPENAI_BASE_URL") or None
    return _AISettings(api_key=api_key, model=model, base_url=base_url)


@lru_cache(maxsize=1)
def _configure_openai_client() -> None:
    """Configure the global Agents SDK client once based on environment settings."""
    settings = _get_settings()
    set_default_openai_key(settings.api_key)
    if settings.base_url:
        client = AsyncOpenAI(api_key=settings.api_key, base_url=settings.base_url)
        set_default_openai_client(client)


@lru_cache(maxsize=1)
def _get_ask_agent() -> Agent[None]:
    """Create a reusable agent for answering questions about markdown content."""
    _configure_openai_client()
    settings = _get_settings()
    return Agent(
        name="Markdown QA",
        instructions=(
            "You are an expert technical writer and editor for Markdown documents. "
            "Answer questions precisely and concisely based on the provided content."
        ),
        model=settings.model,
        model_settings=ModelSettings(temperature=0.2),
    )


@lru_cache(maxsize=1)
def _get_edit_agent() -> Agent[None]:
    """Create a reusable agent for editing markdown documents."""
    _configure_openai_client()
    settings = _get_settings()
    return Agent(
        name="Markdown Editor",
        instructions=(
            "You are an expert Markdown editor. Always return the FULL UPDATED MARKDOWN "
            "inside a single fenced code block using the language identifier 'markdown'. "
            "Do not include any commentary outside the code fence."
        ),
        model=settings.model,
        model_settings=ModelSettings(temperature=0.1),
    )


def _normalize_output(output: object) -> str:
    if output is None:
        raise AIServiceError("Agent returned no output.")
    if not isinstance(output, str):
        output = str(output)
    trimmed = output.strip()
    if not trimmed:
        raise AIServiceError("Agent returned an empty response.")
    return trimmed


@dataclass
class StreamChunk:
    type: Literal["delta", "final"]
    text: str


async def _stream_agent(agent: Agent[None], prompt: str) -> AsyncIterator[StreamChunk]:
    try:
        run = Runner.run_streamed(agent, prompt)
    except AgentsException as exc:  # pragma: no cover - defensive: construction errors
        raise AIServiceError(f"Agent run failed: {exc}") from exc
    except Exception as exc:  # pragma: no cover - safety net for unexpected errors
        raise AIServiceError("Unexpected error while starting the AI agent.") from exc

    try:
        async for event in run.stream_events():
            if isinstance(event, RawResponsesStreamEvent):
                data = event.data
                if isinstance(data, ResponseTextDeltaEvent):
                    delta = data.delta or ""
                    if delta:
                        yield StreamChunk(type="delta", text=delta)
    except AgentsException as exc:
        raise AIServiceError(f"Agent run failed: {exc}") from exc
    except Exception as exc:  # pragma: no cover - safety net for unexpected errors
        raise AIServiceError("Unexpected error while running the AI agent.") from exc

    final_output = _normalize_output(getattr(run, "final_output", None))
    yield StreamChunk(type="final", text=final_output)


async def ask(path: str, content: str, message: str) -> AsyncIterator[StreamChunk]:
    agent = _get_ask_agent()
    prompt = f"File: {path}\n\nContent:\n\n{content}\n\nQuestion: {message}"
    async for chunk in _stream_agent(agent, prompt):
        yield chunk


_FENCE_RE = re.compile(r"```(?:markdown|md)?\n([\s\S]*?)\n```", re.IGNORECASE)


def _extract_markdown(text: str) -> str:
    match = _FENCE_RE.search(text)
    if match:
        return match.group(1).strip()
    return text.strip()


async def edit(path: str, content: str, message: str) -> AsyncIterator[StreamChunk]:
    agent = _get_edit_agent()
    prompt = (
        f"File: {path}\n\nCurrent Markdown content:\n\n{content}\n\nInstruction:\n{message}\n\n"
        "Remember to respond ONLY with a single fenced code block containing the full updated markdown."
    )
    async for chunk in _stream_agent(agent, prompt):
        if chunk.type == "final":
            proposed = _extract_markdown(chunk.text)
            if not proposed:
                raise AIServiceError("Agent returned an empty edit.")
            yield StreamChunk(type="final", text=proposed)
        else:
            yield chunk
