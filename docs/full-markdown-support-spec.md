# Full Markdown Syntax Support

## Summary
Expand the markdown rendering pipeline so every construct in the referenced sample (headings, nested lists, tables with captions, definition lists, line blocks, footnotes, inline/display math, smart punctuation, etc.) renders accurately in the editor preview without losing existing behaviors.

## TODOs
- [x] Inventory the current markdown renderer to document which constructs from the sample render correctly and which need additional plugins or custom handling.
- [x] Update the UI markdown preview to add the necessary remark plugins for definition lists, math (inline and block), smart punctuation, extended tables, and line blocks.
- [x] Ensure any HTML output is sanitized before rendering to avoid introducing XSS vectors while expanding feature support.
- [x] Add or adjust preview styling to cover new elements like footnotes, table captions, definition lists, math blocks, and line blocks.
- [ ] Manually verify the full sample from the gist renders as expected in preview and document any remaining gaps.

## Verification Notes
- Lists now render with list markers again after Tailwind resets because preview styles reintroduce ordered and unordered bullets.
- Inline and block math are emitted via custom remark transforms; confirm rendering by loading the gist sample once the UI preview is running.
