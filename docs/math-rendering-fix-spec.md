# Math Rendering Alignment

## Summary
The markdown preview shows raw TeX characters for inline and block math because our custom `remarkMath` plugin only decorates nodes with CSS classes. GitHub processes the same syntax via MathJax (per their documentation) so formulas appear typeset. We need to align our renderer with GitHub’s behavior so `$x^2$` and `$$\int$$` expressions display as math instead of plain text.

## TODOs
- [ ] Capture the current preview output for representative inline and block math samples and compare it to GitHub’s rendering to confirm the gaps.
- [x] Choose a MathJax-based pipeline (adopted `remark-math` + `rehype-mathjax`) so `math` and `inlineMath` nodes are converted into MathML during render.
- [x] Update the preview component to run the MathJax transformation after markdown render so inline and block formulas are typeset automatically.
- [x] Adjust or remove the existing CSS fallbacks so MathJax containers inherit neutral styles instead of the old `.markdown-math-*` decorations.
- [ ] Manually verify the GitHub math examples render identically in our preview and note any limitations (e.g., unsupported extensions) in `docs/notes.md`.
