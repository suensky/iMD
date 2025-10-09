## Summary

Make the AI chat experience stream responses token-by-token. The backend service should expose fully async interfaces that forward partial completions as they arrive from OpenAI, and the FastAPI endpoint must relay those chunks so the UI can render answers progressively instead of waiting for the full string.

## TODO

- Investigate the `openai-agents` Runner to confirm how to request streamed responses (e.g., token callbacks or async generators) and verify compatibility with existing agent configuration.
- Refactor `backend/src/app/services/ai_service.py` to provide async streaming helpers for both ask and edit flows while preserving shared environment setup.
- Update the FastAPI route in `backend/src/app/api/ai.py` to become async and return a streaming response that yields JSON or text chunks the frontend can consume incrementally.
- Extend the UI `aiChat` helper and `Chat` component to consume streaming responses, update the placeholder message as each chunk arrives, and close the stream cleanly on completion or error.
- Ensure error handling surfaces meaningful failure states on both backend and frontend, including early termination of the stream.
- Document any new configuration or usage notes if the streaming shape differs from the existing API contract.
