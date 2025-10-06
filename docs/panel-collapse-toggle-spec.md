# Panel Collapse Toggle Spec

## Summary
Add intuitive collapse/expand toggles for the left file explorer and right Ask AI panels so users can hide either sidebar and reclaim workspace, mirroring ChatGPT's close sidebar interaction.

## TODO
- [x] Introduce UI state in `ui/src/App.tsx` to track when the file explorer or Ask AI panel is collapsed and adjust the `PanelGroup` layout accordingly.
- [x] Add a header control within `Sidebar` that uses a lucide icon button to collapse the panel with an accessible label.
- [x] Add a matching header control within `Chat` for collapsing the Ask AI panel, using a lucide icon to mirror ChatGPT's sidebar toggle.
- [x] Provide icon-only collapsed states in line with ChatGPT's narrow sidebar so users can rediscover controls while conserving space.
- [ ] Verify responsive behavior so toggling works across typical desktop viewport widths without breaking existing resize handles.
