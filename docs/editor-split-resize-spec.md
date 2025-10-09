## Summary
- Add draggable resizing to the editor's split view so users can adjust the relative widths of the markdown editor and preview panes by dragging the separator.

## TODO
- Introduce shared state to track the current editor/preview width ratio while in split mode, including sensible defaults and bounds.
- Render a visible divider between the panes only during split mode and wire up pointer/mouse drag events to update the ratio in real time.
- Update the editor and preview containers to respect the ratio and reflow smoothly, falling back to equal widths when resizing stops or when leaving split mode.
- Handle edge cases such as dragging beyond bounds, releasing the pointer outside the editor, and window resizing (keep ratio valid).
- Persist the last used ratio for the session (e.g., `useState` + optional local storage) so the layout feels consistent across toggles.
- Add lightweight accessibility affordances (cursor, ARIA role, keyboard focus handling if feasible) for the divider.
