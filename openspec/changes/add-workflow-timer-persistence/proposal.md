## Why

The current Workflow timer resets to `0` after restarting VS Code. Users reopening a previous conversation lose the per-turn duration context that was shown in the Workflow header.

## What Changes

- Persist the per-turn Workflow duration locally (best-effort) so that reopening an existing conversation after restart can show the last recorded duration in the Workflow header.
- Scope: per turn (per user message → final answer), matching the existing Workflow header timer.
- No backfill for turns that completed before installing this feature.

## Impact

- UX: finished turns show stable durations instead of resetting to 0 on restart.
- Storage: small local key/value map per conversation turn.
- Compatibility: relies on `conversationId` exposed to the webview item renderer; falls back to best-effort keys when needed.

