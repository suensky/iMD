from __future__ import annotations

import os
import re
from dataclasses import dataclass
from typing import Optional

from openai import OpenAI

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

client: Optional[OpenAI] = None
if OPENAI_API_KEY:
    client = OpenAI(api_key=OPENAI_API_KEY)


@dataclass
class AskResult:
    answer: str


@dataclass
class EditResult:
    proposedContent: str


def ensure_client():
    if not client:
        raise RuntimeError("OpenAI not configured. Set OPENAI_API_KEY.")
    return client


def ask(path: str, content: str, message: str) -> AskResult:
    c = ensure_client()
    system = (
        "You are an expert technical writer and editor for Markdown documents. "
        "Answer questions precisely and concisely based on the provided content."
    )
    user = f"File: {path}\n\nContent:\n\n" + content + "\n\nQuestion: " + message
    resp = c.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.2,
    )
    answer = resp.choices[0].message.content or ""
    return AskResult(answer=answer.strip())


_FENCE_RE = re.compile(r"```(?:markdown|md)?\n([\s\S]*?)\n```", re.IGNORECASE)


def _extract_markdown(text: str) -> str:
    m = _FENCE_RE.search(text)
    if m:
        return m.group(1).strip()
    return text.strip()


def edit(path: str, content: str, message: str) -> EditResult:
    c = ensure_client()
    system = (
        "You are an expert Markdown editor. Given a Markdown file and an instruction, "
        "return the FULL UPDATED MARKDOWN inside a single fenced code block with language 'markdown'. "
        "Do not include any commentary outside the code fence."
    )
    user = (
        f"File: {path}\n\nCurrent Markdown content:\n\n{content}\n\nInstruction:\n{message}\n\n"
        "Respond ONLY with a single fenced code block containing the full updated markdown."
    )
    resp = c.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.2,
    )
    raw = resp.choices[0].message.content or ""
    proposed = _extract_markdown(raw)
    return EditResult(proposedContent=proposed)
