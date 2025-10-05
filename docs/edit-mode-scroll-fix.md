# Edit Mode Scroll Fix

## Summary
- Users report that the markdown editor stops scrolling in edit mode while preview mode scrolls correctly.
- Initial inspection points to the editor container clipping overflow, preventing CodeMirror from scrolling the document.

## TODO
- Inspect `Editor.tsx` layout to confirm which wrapper div constrains overflow in edit mode.
- Update the edit-mode container styling so CodeMirror can scroll while preserving existing layout structure.
- Manually verify scroll behavior in both edit and preview modes after the adjustment.
