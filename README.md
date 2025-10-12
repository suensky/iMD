# iMD

## Development Setup
- Install Node.js 18+, `pnpm`, Python 3.11+, and `uv` (via `pipx install uv` or Homebrew) before continuing.
- Copy the sample environment file: `cp backend/.env.example backend/.env`, then adjust secrets as needed.
- Install all project dependencies in one shot with `make install` (runs `pnpm install` for the UI and `uv sync` for the backend).

## Running the App Locally
- Start both services together with `make run`; this launches Vite on port 5173 and the FastAPI server on port 8000 with auto-reload.
- Run just the frontend via `make run-ui` (equivalent to `pnpm run dev` in `ui/`).
- Run just the backend via `make run-backend BACKEND_ENV_FILE=backend/.env` (wraps `uv run uvicorn app.main:app --app-dir src --reload`).
- Stop any command with `Ctrl+C`; `make run` will tear down both processes gracefully.
