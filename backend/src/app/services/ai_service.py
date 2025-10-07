from __future__ import annotations

import os
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from openai import OpenAI


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
def _get_client() -> OpenAI:
    settings = _get_settings()
    return OpenAI(api_key=settings.api_key, base_url=settings.base_url)


@dataclass
class AskResult:
    answer: str


@dataclass
class EditResult:
    proposedContent: str


def _format_messages(system: str, user: str) -> list[dict]:
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def _run_agent(messages: list[dict], temperature: float = 0.2) -> str:
    client = _get_client()
    settings = _get_settings()

    # Prefer Responses API when available (new Agent SDK surface)
    if hasattr(client, "responses"):
        formatted_input = [
            {
                "role": m["role"],
                "content": [{"type": "text", "text": m["content"]}],
            }
            for m in messages
        ]
        response = client.responses.create(
            model=settings.model,
            input=formatted_input,
            temperature=temperature,
        )
        output_chunks: list[str] = []
        for item in getattr(response, "output", []):
            if getattr(item, "type", "") != "message":
                continue
            for block in getattr(item, "content", []):
                if getattr(block, "type", "") == "text":
                    output_chunks.append(block.text.value)
        if not output_chunks:
            fallback_text = getattr(response, "output_text", None)
            if fallback_text:
                return fallback_text.strip()
            raise AIServiceError("OpenAI agent response was empty.")
        return "\n\n".join(chunk.strip() for chunk in output_chunks if chunk).strip()

    # Fallback to Chat Completions for older SDKs
    response = client.chat.completions.create(
        model=settings.model,
        messages=messages,
        temperature=temperature,
    )
    content = ""
    if response.choices:
        content = response.choices[0].message.content or ""
    if not content:
        raise AIServiceError("OpenAI agent response was empty.")
    return content.strip()


def ask(path: str, content: str, message: str) -> AskResult:
    system = (
        "You are an expert technical writer and editor for Markdown documents. "
        "Answer questions precisely and concisely based on the provided content."
    )
    user = f"File: {path}\n\nContent:\n\n{content}\n\nQuestion: {message}"
    answer = _run_agent(_format_messages(system, user))
    return AskResult(answer=answer)


_FENCE_RE = re.compile(r"```(?:markdown|md)?\n([\s\S]*?)\n```", re.IGNORECASE)


def _extract_markdown(text: str) -> str:
    match = _FENCE_RE.search(text)
    if match:
        return match.group(1).strip()
    return text.strip()


def edit(path: str, content: str, message: str) -> EditResult:
    system = (
        "You are an expert Markdown editor. Given a Markdown file and an instruction, "
        "return the FULL UPDATED MARKDOWN inside a single fenced code block with language 'markdown'. "
        "Do not include any commentary outside the code fence."
    )
    user = (
        f"File: {path}\n\nCurrent Markdown content:\n\n{content}\n\nInstruction:\n{message}\n\n"
        "Respond ONLY with a single fenced code block containing the full updated markdown."
    )
    raw = _run_agent(_format_messages(system, user))
    proposed = _extract_markdown(raw)
    if not proposed:
        raise AIServiceError("OpenAI agent returned an empty edit.")
    return EditResult(proposedContent=proposed)
