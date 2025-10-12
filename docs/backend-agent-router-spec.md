## Summary
- Unify the backend AI entrypoint behind a single `/ai` API that routes each request to a pluggable agent implementation.
- Support multiple agent frameworks (OpenAI Agents SDK, Google ADK, and future providers) selected via configuration without code changes in the router.
- Allow different request modes (`ask`, `edit`, etc.) to target different agents while reusing shared logging and streaming utilities.

## TODOs
- Document configuration shape (env or settings module) that maps request modes to agent provider/backends and model options.
- Define an abstract agent runner interface exposing shared ask/edit streaming contract.
- Implement adapters for existing OpenAI Agents SDK usage and new Google ADK-backed agent.
- Add factory/registry that instantiates correct adapter based on configuration and caches reusable clients.
- Refactor `ai_service` to delegate to the registry instead of hardcoding OpenAI logic while preserving streaming behavior.
- Extend backend `.env.example` with required settings for selecting provider and Google ADK credentials if applicable.
- Update FastAPI route(s) or service entrypoints to pass request metadata needed for provider selection.
- Provide developer documentation on adding new agent providers and configuring routing.
