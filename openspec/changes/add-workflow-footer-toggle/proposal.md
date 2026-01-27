## Why

When a Workflow is expanded and contains a long list of items, users must scroll back to the top to click the header to collapse it. This is inconvenient and interrupts reading flow.

## What Changes

- In expanded state only, render a bottom “footer” row that looks identical to the top Workflow header row.
- The footer row toggles collapse/expand, so users can collapse from the bottom after scrolling.
- In collapsed state, keep the current UI (only the top header row is shown).

## Impact

- UX: easier collapse interaction for long workflows.
- Layout: adds one additional row only when expanded; no change to the expanded content rendering.

