# AI Chat Logging

## Summary
- Add structured logging to the `/ai/chat` FastAPI router so incoming payloads and downstream processing results are easy to trace during debugging.

## TODO
- [x] Introduce a module-level logger in `backend/src/app/api/ai.py`.
- [x] Log the received request payload (path, mode, message length, selection flag).
- [x] Log file read context useful for debugging (e.g., content length).
- [x] Log responses coming back from `ai_service.ask` and `ai_service.edit` with concise previews.
- [x] Ensure error handling logs the failure path before raising an HTTP exception.
