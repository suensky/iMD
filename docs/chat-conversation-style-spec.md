# Chat Conversation Style Spec

## Summary
- Update the chat conversation area to mimic ChatGPT with assistant messages on the left and user messages right-aligned.
- Apply a light background to user messages while keeping assistant messages background-free.
- Introduce a hover-only copy affordance beneath user messages that copies the raw message text to the clipboard.

## TODO
- Refine the `Chat` message list markup to support left/right alignment, background styling, and hover actions.
- Add scoped styles (Tailwind utility classes or component-specific styles) to achieve the requested layout and visual treatment.
- Implement a clipboard copy button for user messages that appears on hover, includes an accessible label, and copies the message text.
- Ensure hover/click states look correct across light/dark themes and that focus styles are present for keyboard users.
