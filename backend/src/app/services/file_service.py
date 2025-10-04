from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from fastapi import HTTPException

# Workspace root is limited to WORKSPACE_DIR
WORKSPACE_DIR = Path(os.getenv("WORKSPACE_DIR", "/Users/husun/github/coders/markdown/workspace")).resolve()


def _safe_join(rel_path: str) -> Path:
    # Disallow absolute paths and parent traversal
    candidate = (WORKSPACE_DIR / rel_path).resolve()
    try:
        candidate.relative_to(WORKSPACE_DIR)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid path")
    return candidate


def list_dir(rel_path: str = "") -> list[dict]:
    base = _safe_join(rel_path)
    if not base.exists():
        raise HTTPException(status_code=404, detail="Path not found")
    if not base.is_dir():
        raise HTTPException(status_code=400, detail="Not a directory")

    items: list[dict] = []
    for entry in sorted(base.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower())):
        if entry.is_file() and not entry.name.endswith(".md"):
            # Only expose markdown files for files; directories are allowed
            continue
        stat = entry.stat()
        items.append(
            {
                "name": entry.name,
                "path": str((Path(rel_path) / entry.name).as_posix()),
                "is_dir": entry.is_dir(),
                "size": stat.st_size,
                "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            }
        )
    return items


def read_file(rel_path: str) -> dict:
    p = _safe_join(rel_path)
    if not p.exists() or not p.is_file() or not p.name.endswith(".md"):
        raise HTTPException(status_code=404, detail="File not found")
    return {"path": rel_path, "content": p.read_text(encoding="utf-8")}


def write_file(rel_path: str, content: str) -> dict:
    p = _safe_join(rel_path)
    if not p.parent.exists():
        raise HTTPException(status_code=400, detail="Parent directory does not exist")
    if not p.name.endswith(".md"):
        raise HTTPException(status_code=400, detail="Only .md files are allowed")
    p.write_text(content, encoding="utf-8")
    return {"ok": True}
