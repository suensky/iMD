## Summary

Revamp the Ask AI input experience to match ChatGPT's chat composer. The text area should visually mirror ChatGPT's rounded pill styling, and an up-arrow send button needs to appear once the user types any content. Submission happens when the user presses Enter or clicks the button, matching the chat flow expectations.

## TODO

- Audit the current Ask AI component structure to identify where the composer is defined and how messages are dispatched.
- Update the input box markup and styles to replicate ChatGPT's composer (rounded border, subtle shadow, textarea growth, icon placement).
- Add an up-arrow send icon that activates when the input is non-empty and triggers the same send action as the current submission path.
- Ensure Enter keypress submits the prompt with Shift+Enter preserving newline behavior and keeps existing accessibility hooks.
- Confirm the send control disables appropriately during pending submissions and that styling remains responsive on smaller screens.
