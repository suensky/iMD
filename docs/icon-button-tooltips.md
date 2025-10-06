# Icon Button Tooltips

## Summary
Users want icon-only buttons across the UI to always expose descriptive tooltips so their purpose is clear without relying on screen reader labels.

## TODOs
- Sidebar: add a `title` tooltip reading "Close sidebar" to the collapse button in the expanded view and ensure the expand control retains accessible labeling.
- Editor: add a `title` tooltip reading "Preview" to the preview toggle button while keeping the existing `aria-label` state handling.
- Ask AI panel: add a `title` tooltip reading "Close sidebar" to the collapse button in the header; confirm the collapsed toggle remains labeled appropriately.
- Verify the title attributes appear on hover in the browser and do not regress existing aria-label behavior.
