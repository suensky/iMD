# Editor Toolbar Icon Buttons Spec

## Summary
Replace the text-based `Save` and `Save As` controls in the editor toolbar with icon-only buttons that match the preview toggle styling while still providing accessible tooltips and labels.

## TODOs
- [x] Swap the current text buttons in `ui/src/components/Editor.tsx` for icon buttons that reuse the existing toolbar button styles.
- [x] Select appropriate icons from `lucide-react` (e.g., `Save` and `FilePlus`) and ensure they include `aria-label`s for screen readers.
- [x] Wrap the new buttons in the shared `Tooltip` component with concise descriptions similar to the preview toggle.
- [x] Preserve loading/disabled states so the user sees progress feedback during save operations.
