# OpenAI Agent Configuration Fix

## Summary
- AI chat requests currently raise `RuntimeError` when `OPENAI_API_KEY` is not set, breaking the right-panel workflow.
- We need to wire the backend to the OpenAI Agent SDK so Q&A and edit flows share a single, properly configured client.

## TODO
- Swap the ad-hoc OpenAI client in `backend/src/app/services/ai_service.py` for an Agent SDK client that lazily loads credentials.
- Source agent configuration (API key, optional base URL/model) from environment via settings to avoid hard failures when unset.
- Return helpful FastAPI errors when the agent is misconfigured instead of surfacing uncaught runtime exceptions.
- Update developer docs or env samples if new configuration knobs are required.
