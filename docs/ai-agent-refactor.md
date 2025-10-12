# AI Agent Refactor Spec

## Summary
- Implement the pluggable agent architecture described in the engineering design doc so all AI requests flow through a single `/api/ai/chat` endpoint.
- Introduce agent routing and strategy interfaces that let us add providers (OpenAI, Google ADK, etc.) without touching FastAPI routing logic.
- Deliver a working Google ADK-backed agent alongside the refactored OpenAI agent as the first two concrete strategy implementations.

## TODOs
- Add new `backend/src/app/agents/` package with `interface.py`, `config.py`, `router.py`, and provider modules for OpenAI and Google ADK.
- Migrate existing OpenAI logic from `services/ai_service.py` into `agents/openai_agent.py` while preserving current ask/edit behaviour and streaming semantics.
- Implement `agents/google_adk_agent.py` using the Google GenAI SDK, mirroring the streaming contract used by the OpenAI agent.
- Expose a unified FastAPI request model (`ChatRequest`) and update `/api/ai/chat` to depend on the `AgentRouterService` for dispatch based on `agent_id`.
- Update dependency management (`backend/pyproject.toml`) to include Google GenAI SDK and ensure configuration environment variables are documented.
- Remove or slim down `services/ai_service.py`, keeping only shared utilities if any, and adjust imports across the backend.
- Verify streaming responses remain newline-delimited JSON and ensure error handling surfaces provider failures cleanly.
