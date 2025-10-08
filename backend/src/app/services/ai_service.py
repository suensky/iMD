from __future__ import annotations

import asyncio
import os
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Optional

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


@dataclass
class AskResult:
    answer: str


@dataclass
class EditResult:
    proposedContent: str


def _run_agent(agent: Agent[None], prompt: str) -> str:
    def _process(result: object) -> str:
        if not hasattr(result, "final_output"):
            raise AIServiceError("Agent returned an unexpected payload.")
        output = getattr(result, "final_output", None)
        if output is None:
            raise AIServiceError("Agent returned no output.")
        if not isinstance(output, str):
            output = str(output)
        trimmed = output.strip()
        if not trimmed:
            raise AIServiceError("Agent returned an empty response.")
        return trimmed

    def _run_sync() -> str:
        try:
            result = Runner.run_sync(agent, prompt)
        except AgentsException as exc:
            raise AIServiceError(f"Agent run failed: {exc}") from exc
        except Exception as exc:  # pragma: no cover - safety net for unexpected errors
            raise AIServiceError("Unexpected error while running the AI agent.") from exc
        return _process(result)

    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        try:
            asyncio.set_event_loop(loop)
            return _run_sync()
        finally:
            asyncio.set_event_loop(None)
            loop.close()

    if loop.is_running():
        future = asyncio.run_coroutine_threadsafe(Runner.run(agent, prompt), loop)
        try:
            result = future.result()
        except AgentsException as exc:
            raise AIServiceError(f"Agent run failed: {exc}") from exc
        except Exception as exc:  # pragma: no cover - safety net for unexpected errors
            raise AIServiceError("Unexpected error while running the AI agent.") from exc
        return _process(result)

    return _run_sync()


def ask(path: str, content: str, message: str) -> AskResult:
    agent = _get_ask_agent()
    prompt = f"File: {path}\n\nContent:\n\n{content}\n\nQuestion: {message}"
    answer = _run_agent(agent, prompt)
    return AskResult(answer=answer)


_FENCE_RE = re.compile(r"```(?:markdown|md)?\n([\s\S]*?)\n```", re.IGNORECASE)


def _extract_markdown(text: str) -> str:
    match = _FENCE_RE.search(text)
    if match:
        return match.group(1).strip()
    return text.strip()


def edit(path: str, content: str, message: str) -> EditResult:
    agent = _get_edit_agent()
    prompt = (
        f"File: {path}\n\nCurrent Markdown content:\n\n{content}\n\nInstruction:\n{message}\n\n"
        "Remember to respond ONLY with a single fenced code block containing the full updated markdown."
    )
    raw = _run_agent(agent, prompt)
    proposed = _extract_markdown(raw)
    if not proposed:
        raise AIServiceError("Agent returned an empty edit.")
    return EditResult(proposedContent=proposed)
