# Markdown Editor Enhancements

## Summary
Implement full markdown editor functionality so users can create new markdown documents, save their work (including "save as" to a new file), and preview rendered markdown directly in the app.

## TODOs
- [x] Backend: confirm existing `/api/file` `PUT` supports creating new `.md` files; add validation or helper if gaps appear during implementation.
- [x] UI: add a "New" action that prompts for a markdown filename, creates the file via `writeFile`, refreshes the file list, and opens the new document immediately.
- [x] UI: track editor dirty state so save buttons enable/disable appropriately and unsaved changes are preserved until explicitly saved.
- [x] UI: extend save controls to include "Save" (current path) and "Save As" (prompt for new filename/path) using backend write APIs, then update selection when the path changes.
- [x] UI: refine preview experience to render markdown within the editor view, ensuring toggle between edit and preview states works seamlessly with new file workflows.
- [ ] Unit tests: add unit tests for new code. Ensure code coverage but don't over engineering.
- [ ] Testing/QA: manually verify creation, save, save-as, and preview flows within the workspace sandbox using sample markdown files.
