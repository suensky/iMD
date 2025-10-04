# Repository Guidelines

## Project Structure & Module Organization
- `backend/` houses the FastAPI service under `src/app`, split into `api/` routers and `services/` helpers; env samples live in `.env.example`.
- `ui/` is a Vite + React + TypeScript app with feature code in `src/components`, shared utilities in `src/lib`, and Tailwind-driven styles in `src/index.css`.
- `docs/spec.md` captures the system design, while `workspace/` contains editable markdown fixtures (e.g., `notes.md`) used during development.

## Build, Test, and Development Commands
- `make install` installs both stacks (`pnpm install` for the UI, `uv sync` for the backend).
- `make run` starts UI and API together; use `make run-ui` or `make run-backend BACKEND_ENV_FILE=backend/.env` when iterating on one side.
- Backend-only workflows can also use `uv run --env-file backend/.env uvicorn app.main:app --app-dir src --reload`.
- The UI builds with `pnpm run build`; lint locally via `pnpm run lint` before opening a PR.

## Coding Style & Naming Conventions
- Python modules use snake_case filenames, 4-space indents, type hints, and FastAPI route functions returning dictionaries serialized by Pydantic models.
- Frontend files use PascalCase for components, camelCase for hooks/utilities, and are formatted by Prettier (2-space indents) plus ESLint rules from `eslint.config.js`.
- Favor colocating domain logic in `services/` (backend) or `lib/` (frontend) to keep React components lean.

## Testing Guidelines
- Automated tests are not yet in the repo; add backend coverage with Pytest under `backend/tests/` and run via `uv run pytest`.
- Frontend tests should live beside components or under `ui/src/__tests__`, using Vitest + React Testing Library and executed with a `pnpm run test` script.
- Mirror production usage by seeding markdown fixtures in `workspace/` so file APIs and chat flows are exercised end-to-end.

## Commit & Pull Request Guidelines
- Follow short, imperative commit summaries with optional scope tags (e.g., `backend: guard .md writes`); keep related changes squashed.
- PRs should describe user-visible impact, list key commands run (`pnpm run lint`, `uv run pytest`), and reference any tracked issues.
- Include screenshots or console snippets when touching the UI or API contracts to document expected behavior.

## Security & Configuration Tips
- Never commit `.env`; copy from `backend/.env.example` and keep secrets in local `.env` files.
- Respect the workspace sandbox: all file access must stay within `WORKSPACE_DIR`, and only `.md` files should be created or modified.

## AI Feature development guidline
When user request to do a new feature or fix a bug, always add a feature spec markdown file under docs/ folder with a reasonable name. In this spec, you should have a summary of the feature request. Then list the TODOs to accomplish this feature. After confirming with user, then proceed to implement following the specs.