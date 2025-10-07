## Summary
- Add a third display mode to the markdown editor so users can view the rendered preview without the code editor.
- Provide clear UI affordances to switch between editor-only, split view, and preview-only modes.
- Preserve existing behaviors such as scroll synchronization when both panes are visible.

## TODO
- Replace the boolean preview toggle in `ui/src/components/Editor.tsx` with a previewMode state that tracks `editor`, `split`, or `preview`.
- Update the preview toggle controls/tooltip so users can cycle between the three modes and understand the current state.
- Adjust layout, conditional rendering, and CSS classes to hide the appropriate pane while ensuring the visible pane stretches to the full width.
- Guard scroll-sync effects so they only run when both editor and preview panes are mounted.
- Verify that saving, editing, and preview rendering continue to work in all three modes.
