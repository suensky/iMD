# AI Markdown Editor — Backend

FastAPI backend for the local-first AI-assisted Markdown editor.

- API base: http://127.0.0.1:8000/api
- CORS during dev: http://localhost:5173

## Quickstart

1) Copy environment file and set your OpenAI key

   cp .env.example .env
   # edit .env and set OPENAI_API_KEY

2) Start the dev server (via uv)

   at top level, run `make run`

3) Test health

   curl -s http://127.0.0.1:8000/api/health

## Endpoints

- GET /api/files?path=""
  - List directories and .md files under the workspace subtree.
  - Returns: [{ name, path, is_dir, size, modified_at }]

- GET /api/file?path=relative/path.md
  - Returns: { path, content }

- PUT /api/file?path=relative/path.md
  - Body: { "content": "..." }
  - Returns: { ok: true }

- POST /api/ai/chat
  - Body: { path: string, mode: "ask" | "edit", message: string, selection?: string }
  - ask → { answer: string }
  - edit → { proposedContent: string }

## Notes

- All file operations are restricted to the workspace directory only and to .md files.
- Path traversal is blocked.
- The AI edit endpoint expects the model to return the full updated markdown wrapped in a single fenced code block; the server extracts the markdown from the fence.