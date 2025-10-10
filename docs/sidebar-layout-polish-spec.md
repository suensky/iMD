# Sidebar Layout Polish Spec

## Summary
- Collapsed sidebar currently remains too wide, making toggling ineffective in both the main workspace and embedded views such as AI Notes.
- AI Notes sidebar variant shows excessive vertical spacing between the header/logo area and the file list, creating visual disconnection.
- Goal is to refine sizing and spacing so the collapsed experience feels compact and the embedded variant reads as a cohesive block.

## TODO
- [ ] Audit `ui/src/App.tsx` and any shared sidebar layout styles to document current width and padding behavior in collapsed mode.
- [ ] Tighten the collapsed-state width via Tailwind utility adjustments so it feels significantly narrower while keeping icons legible.
- [ ] Ensure the expanded-state width remains consistent and unaffected for standard use.
- [ ] Review `WorkspaceView` / AI Notes sidebar integration and reduce vertical spacing between logo/header and file list for a balanced composition.
- [ ] Confirm spacing updates play nicely with both light/dark themes and hover/focus states.
- [ ] Manually verify collapse/expand interactions across main workspace and AI Notes views.
- [ ] Run `pnpm run lint` to validate frontend changes once implemented.
