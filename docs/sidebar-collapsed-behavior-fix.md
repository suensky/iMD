## Summary
- When the SeaStar sidebar is collapsed, remove the dedicated expand button and allow the SeaStar logo to toggle expansion so the UI matches the desired compact state.
- After entering any subpage (AI Notes or other entries previously under New Chat), hide the `New Chat` button and associated submenu items so the sidebar mirrors the embedded AI Notes layout.
- Reduce the minimum sidebar width during resize so it can shrink to just accommodate the widest visible row.

## TODO
- [x] Update the sidebar collapse logic to wire expansion to the logo in collapsed mode and remove the extra expand button control.
- [x] Adjust view-switching state so selecting any submenu entry hides both the `New Chat` button and the submenu items until the user returns to the landing chat view.
- [x] Lower the `Panel` minimum size so resizing allows a narrow width that still fits the widest row content.
- [ ] Manually exercise collapsed and expanded modes to confirm tooltips, focus behaviour, and profile access remain intact.
