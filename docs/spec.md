# AI Markdown Editor — Technical Design and Setup Plan

This document describes the architecture, tech stack, API, security constraints, and concrete steps to stand up a local-first AI-assisted Markdown editor with a React frontend and a Python backend.

## Goals
- Left sidebar: browse markdown files under a single local workspace directory.
- Main canvas: edit Markdown with syntax highlighting and preview toggle.
- Right panel: AI chat to ask questions about or propose edits to the currently open file.
- Non-destructive workflow: AI proposes a full updated markdown body; user reviews diff and then applies changes to disk.

## Architecture Overview
- Monorepo layout (within the existing repo):
  - docs/spec.md (this file)
  - ui/ (React + Vite + TypeScript)
  - backend/ (FastAPI, package-managed by uv)
  - workspace/ (local .md files; only subtree accessible to backend file ops)
- Dev ports: UI 5173, API 8000.
- Backend proxies AI provider (OpenAI by default). API key loaded via env.

## Tech Choices
- Frontend
  - Vite + React + TypeScript
  - Tailwind CSS
  - TanStack Query for server-state
  - react-router-dom
  - Zustand for simple UI state
  - Editor: CodeMirror 6 via @uiw/react-codemirror + @codemirror/lang-markdown
  - Markdown preview: react-markdown + remark-gfm
  - Layout: react-resizable-panels for 3-pane resizable UI
  - Icons: lucide-react
- Backend
  - FastAPI + Uvicorn
  - Pydantic + pydantic-settings
  - httpx
  - openai (configurable model)
  - Managed with uv (pyproject.toml + uv.lock)
- Security
  - All file operations restricted to workspace/ subtree
  - Reject path traversal; permit only .md files
  - CORS limited to http://localhost:5173 during development

## API Design (versioned under /api)
- Files
  - GET /api/files
    - Query: path (optional, relative to workspace; default "")
    - Returns: array of { name, path, is_dir, size, modified_at }
  - GET /api/file
    - Query: path (required)
    - Returns: { path, content }
  - PUT /api/file
    - Query: path (required)
    - Body: { content: string }
    - Returns: { ok: true }
- AI
  - POST /api/ai/chat
    - Body: { path: string, mode: "ask" | "edit", message: string, selection?: string }
    - ask → returns { answer: string }
    - edit → returns { proposedContent: string } (full markdown body)

## Frontend Implementation Notes
- Project structure (ui/src):
  - app/ (routes, layout)
  - components/ (Sidebar, Editor, Chat, Split)
  - features/files (query hooks: useFileTree, useFile, useUpdateFile)
  - features/ai (chat client + types)
  - lib/api (fetch wrapper with baseURL /api)
  - styles (tailwind.css)
- Vite dev proxy forwards /api → http://127.0.0.1:8000
- TanStack Query for data fetching; disable optimistic updates for file writes
- Editor: CodeMirror for editing; button to toggle Preview (react-markdown)
- Chat remembers history per open file (in-memory)

## Backend Implementation Notes
- Structure (backend/src/app):
  - main.py (FastAPI app + CORS + include routers)
  - api/files.py (list/read/write)
  - api/ai.py (chat/edit)
  - services/file_service.py (safe path ops limited to WORKSPACE_DIR)
  - services/ai_service.py (OpenAI wrapper and prompts)
- Env variables (backend/.env):
  - OPENAI_API_KEY=
  - WORKSPACE_DIR=/Users/husun/github/coders/markdown/workspace
  - OPENAI_MODEL=gpt-4o-mini
- AI prompts
  - ask: summarize/explain content with safe, precise markdown examples
  - edit: return entire updated markdown in a single fenced code block with language "markdown" and no extra commentary

## Directory Layout (expected)
- docs/spec.md
- ui/
- backend/
- workspace/

## Concrete Steps (non-interactive commands)

All commands assume the repo root at /Users/husun/github/coders/markdown.

1) Create docs/spec.md and base folders
- Create docs/ and write this file (already handled by automation).
- Create workspace/ (will hold .md files).

2) Scaffold the React app (ui/)
- Create Vite React + TS app:
  pnpm create vite@latest /Users/husun/github/coders/markdown/ui -- --template react-ts
- Install runtime deps:
  pnpm --dir /Users/husun/github/coders/markdown/ui add react-router-dom @tanstack/react-query zustand lucide-react @uiw/react-codemirror @codemirror/lang-markdown react-markdown remark-gfm react-resizable-panels
- Install dev deps:
  pnpm --dir /Users/husun/github/coders/markdown/ui add -D tailwindcss postcss autoprefixer eslint prettier eslint-config-prettier eslint-plugin-react eslint-plugin-react-hooks @types/node
- Initialize Tailwind:
  pnpm dlx --package=tailwindcss tailwindcss init -p --cwd /Users/husun/github/coders/markdown/ui
- Configure Tailwind (ui/tailwind.config.*): set content to ["./index.html", "./src/**/*.{ts,tsx}"]
- Add Tailwind directives to ui/src/index.css:
  @tailwind base; @tailwind components; @tailwind utilities;
- Configure Vite proxy (ui/vite.config.ts):
  server: { proxy: { "/api": { target: "http://127.0.0.1:8000", changeOrigin: true } } }
- Implement initial components: Sidebar, Editor (CodeMirror + preview), Chat, and a 3-pane layout using react-resizable-panels. Wire React Query hooks to the backend endpoints.

3) Scaffold the Python backend (backend/) with uv
- Initialize project:
  mkdir -p /Users/husun/github/coders/markdown/backend
  uv init --python 3.12 /Users/husun/github/coders/markdown/backend
- Add dependencies:
  uv add --directory /Users/husun/github/coders/markdown/backend fastapi "uvicorn[standard]" pydantic pydantic-settings httpx python-dotenv openai
- Create package structure under backend/src/app with modules:
  - main.py: FastAPI app, CORS (allow http://localhost:5173), include files and ai routers at prefix /api
  - api/files.py: GET /api/files, GET /api/file, PUT /api/file (safe workspace-only ops)
  - services/file_service.py: resolve paths safely, list directory, read/write files, restrict to .md, block traversal
  - api/ai.py: POST /api/ai/chat handling modes ask/edit; delegate to ai_service
  - services/ai_service.py: OpenAI client; prompts for ask/edit; extract fenced markdown on edit
- Environment files:
  - backend/.env.example with OPENAI_API_KEY=, WORKSPACE_DIR=/Users/husun/github/coders/markdown/workspace, OPENAI_MODEL=gpt-4o-mini
  - Add backend/.env to .gitignore
- Dev server:
  uv run --env-file /Users/husun/github/coders/markdown/backend/.env --directory /Users/husun/github/coders/markdown/backend uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

4) Seed workspace and run
- mkdir -p /Users/husun/github/coders/markdown/workspace
- Create /Users/husun/github/coders/markdown/workspace/notes.md with sample content
- Start backend (command above) and UI:
  pnpm --dir /Users/husun/github/coders/markdown/ui dev

5) Verify end-to-end
- Open http://localhost:5173
- File list appears from workspace
- Open, edit, and save a file → PUT /api/file succeeds
- Chat ask (mode=ask) returns an answer
- Chat edit (mode=edit) proposes full markdown; show diff and apply → file on disk updates

## Future Enhancements
- Streaming responses via SSE for chat
- Apply edits as diffs/patches instead of full overwrite
- Multi-provider model selection (Anthropic, OpenRouter, local LLMs)
- Tests: pytest + requests (backend), vitest + React Testing Library (frontend)
