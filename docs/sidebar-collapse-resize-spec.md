# Sidebar Resize & Collapse

## Summary
- Restore the main SeaStar sidebar's drag-to-resize behavior so users can widen or shrink it without affecting the chat canvas.
- Introduce a collapse toggle that snaps the sidebar to a compact, icon-only rail while keeping hover tooltips for navigation clarity.
- When AI Notes or any secondary subpage is active, hide the `New Chat` control so the integrated file explorer sits directly beneath the logo header.
- Remove the file explorer's internal collapse affordance; rely on the global sidebar width and collapse state for layout.

## TODOs
- [x] Re-enable the sidebar resizer with the existing panel primitives, ensuring min/max widths align with the new compact design.
- [x] Add a collapse/expand button that toggles between full-width and icon-only sidebar states, preserving focus management and keyboard access.
- [x] Update view routing so AI Notes and other submenu pages automatically hide the `New Chat` button and position the file explorer beneath the logo block.
- [x] Remove the file explorer collapse button and adjust spacing/typography so the list coexists naturally with the header in both expanded and collapsed modes.
- [ ] Smoke test landing chat, AI Notes workflows, and sidebar collapsing/resizing to confirm no regressions across themes and view switches.
