# Split Editor and Preview Spec

## Summary
Implement a two-pane layout where the left side provides the markdown editor and the right side shows a live preview. The preview should update in real time as the user types. Replace the existing preview button label with a preview icon similar to the one used in VS Code/Cursor.

## TODO
- Update the UI layout to support a persistent two-column editor/preview view with responsive behavior.
- Wire the markdown editor state so changes instantly propagate to the preview pane without requiring a manual refresh.
- Swap the existing preview button text for an icon-only button that toggles preview visibility or focuses the preview pane.
- Ensure styling matches existing design tokens and that the split pane behaves well on different viewport sizes.
- Allow users to close or reopen the preview pane so the editor can occupy the full width when needed.
- Keep the editor and preview scroll positions synchronized so navigating one pane mirrors the other.
- Validate that markdown rendering still supports current features and escapes, including code blocks and math where applicable.
