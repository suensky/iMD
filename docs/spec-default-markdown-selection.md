# Default Markdown Selection Fix

## Summary
- Ensure the app no longer assumes `notes.md` exists and instead falls back to the first available markdown file or none when the list is empty.

## TODOs
- Update the state initialization in `ui/src/App.tsx` to derive the default selection from the available markdown files.
- Allow the editor component to render an empty canvas when no file is selected.
- Verify the sidebar and chat components behave correctly when no file is selected.
