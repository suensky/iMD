# Google ADK Agent Fix

## Summary
- The current `GoogleADKAgent` still targets the legacy `google-genai` SDK, so it never leverages the new Google ADK primitives requested by product.
- We must adopt the official Google ADK `Agent` interface so the backend streaming contract aligns with the rest of the agent framework.
- Dependency and configuration names should reflect the Google ADK package to avoid confusing local setup.

## TODO
- Replace the `google-genai` client usage in `backend/src/app/agents/google_adk_agent.py` with a Google ADK `Agent`, matching the existing ask/edit behaviors and JSONL streaming contract.
- Update backend dependencies (`pyproject.toml`, lockfile) and guardrails to import `google.adk` instead of `google.genai`.
- Ensure environment variables (`GOOGLE_API_KEY`, `GEMINI_API_KEY`, etc.) configure the ADK client and surface clear errors when missing.
- Add or adjust developer docs/env samples if any new configuration steps are required after switching SDKs.
