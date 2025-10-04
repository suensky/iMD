# Save & Save As Backend Spec

## Summary
Introduce dedicated backend endpoints so the editor can distinguish between overwriting the currently open markdown document ("Save") and creating a copy under a new name or location ("Save As"). The save flow must only succeed when the original markdown file already exists inside the workspace, while save-as defaults to creating the new file at the workspace root unless a subdirectory is explicitly provided by the client.

## TODOs
- [ ] Add a `save_file` helper in `backend/src/app/services/file_service.py` that validates the target file already exists, enforces the `.md` extension, and overwrites it with new content.
- [ ] Add a `save_file_as` helper in `backend/src/app/services/file_service.py` that writes content to a new markdown file, defaulting to the workspace root when no directory is given, while still guarding against path traversal and non-markdown extensions.
- [ ] Extend `backend/src/app/api/files.py` with POST routes `/file/save` and `/file/save-as` that call the new helpers, accept simple request bodies, and return consistent metadata (`{"path": ..., "created": bool}`) for UI consumption.
- [ ] Ensure both helpers reuse `_safe_join` to stay within `WORKSPACE_DIR` and raise clear 4xx errors (400 when validation fails, 404 when the original file is missing).
- [ ] Keep the existing `PUT /file` behavior for backwards compatibility until the UI is updated, but delegate to the new helpers internally.
