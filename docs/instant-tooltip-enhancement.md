# Instant Tooltip Enhancement

## Summary
The three icon-only controls for collapsing the file sidebar, hiding the AI chat panel, and toggling the preview currently rely on the browser `title` attribute. Browser tooltips appear slowly and cannot be styled, so we need a custom tooltip that shows immediately and matches the product look (black background, white text).

## TODOs
- Build a reusable tooltip component that renders on hover/focus without delay, supports portal positioning, and exposes styling hooks for a dark tooltip theme.
- Replace the existing `title` attributes on the file sidebar collapse, AI panel collapse, and editor preview toggle buttons with the new tooltip while keeping their `aria-label` behavior.
- Ensure the tooltip component handles keyboard focus (`focus`/`blur`) for accessibility and uses `role="tooltip"` with `aria-describedby` wiring.
- Verify the tooltip can stack above surrounding content (use portal/container) and does not intercept pointer events.
- Smoke test the three buttons in the UI to confirm immediate, styled tooltips and no regressions in button behavior.
