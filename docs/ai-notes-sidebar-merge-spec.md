# AI Notes Sidebar Merge

## Summary
- When the user opens the **AI Notes** view, the markdown file explorer that currently renders inside the workspace should appear in the primary SeaStar sidebar instead of inside the workspace panel.
- The global sidebar should automatically collapse the "New Chat" menu items in this mode, leaving the file explorer directly underneath the New Chat button.
- The workspace content area should adapt to the sidebar relocation (no duplicate left rail) while preserving existing file selection and creation behaviors.

## TODOs
- [x] Detect when the AI Notes view is active and render the file explorer in the main sidebar under the New Chat control, replacing the workspace's internal sidebar in that state.
- [x] Provide the workspace editor/chat panes with the selected file path from the sidebar integration so file selection stays in sync.
- [x] Ensure file creation (`+ New`) and collapse/expand affordances still work intuitively from the merged sidebar, updating styles as needed for the narrower rail.
- [x] Collapse the New Chat dropdown menu by default while AI Notes is active and restore previous behavior for other views.
- [x] Smoke test primary flows (file selection, new file creation, AI Notes navigation) to confirm no regressions in other views.
