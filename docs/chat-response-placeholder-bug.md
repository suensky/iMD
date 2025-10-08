# Chat Response Placeholder Bug

## Summary
- The chat panel keeps displaying the placeholder text `Thinking...` even after the backend returns an answer, leaving users without the AI response.

## TODO
- [x] Inspect how the placeholder entry is tracked in `ui/src/components/Chat.tsx`.
- [x] Adjust the state management so the assistant placeholder is replaced with the real answer on success.
- [ ] Smoke test the chat flow in the UI to confirm the placeholder now updates correctly.
