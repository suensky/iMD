# AI Service Agent SDK Rewrite

## Summary
- Replace the existing OpenAI client wrapper in `backend/src/app/services/ai_service.py` with the OpenAI Agents Python SDK so that question/answer and edit flows run through a managed Agent session.
- Keep configuration sourced from environment variables (API key, base URL, model, agent id) and fail gracefully when misconfigured.

## TODO
- Add the `openai-agents` package to `backend/pyproject.toml` (and refresh `uv.lock`) so the backend can import the new SDK.
- Define any additional environment variables we need (e.g., default agent id) in `backend/.env.example` or the README.
- Refactor `ai_service.py` to build an Agent client once, reuse it for ask/edit calls, and translate existing return types to the new response objects.
- Update API route handlers or service callers if their expectations about response shape change.
- Exercise the updated service locally (or via unit-style harness) to confirm both ask and edit pathways still behave.
