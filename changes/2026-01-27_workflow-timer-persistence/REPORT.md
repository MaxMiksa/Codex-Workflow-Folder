# Workflow Timer Persistence (Per Turn) — Dev & Test Report

Date: 2026-01-27  
Branch: `feature/workflow-timer-persistence`

## Goal

Persist the per-turn Workflow header timer locally so that reopening an existing conversation after restarting VS Code does not reset completed turn durations to `0`.

Scope:
- Per user turn (user message → final answer), matching the existing Workflow header timer.
- Local-only persistence.
- No backfill for turns completed before installing.

## Design Summary

### Keying strategy (MVP)

- Use `conversationId` (available in `LocalConversationItemContent(rt)` props) plus the generated Workflow item id (`workflow-${turnIndex}`) to form a stable-ish key:
  - `codex.workflow.timer.<conversationId>.<workflowId>`

This is intentionally “best-effort”: it is stable for a given conversation’s rendering model but is not a guaranteed upstream turnId.

### Storage & transport

- Webview stores/reads values via existing `useSharedObject(key)` (host message bus).
- Host persists only keys prefixed with `codex.workflow.timer.` into its real persistent store via `globalState.get/update` under:
  - `codex.workflow.timerStore.v1`
- Host seeds the in-memory shared object repository from that persisted map when the webview content is created.

### Write policy

- Webview only writes a duration when a Workflow item has been observed running in the current session and then transitions to done.
- Completed historical turns loaded after restart will display persisted duration and will not overwrite it.

## Implementation Notes (Repo-side patchers)

Host patch:
- `tools/workflow-fold/patcher.mjs` updates `patchExtensionHostJs` to inject `CODEX_WORKFLOW_FOLD_HOST_V7`.
- Injection performs:
  - meta tag insertion (existing)
  - one-time seeding from `globalState`
  - monkey-patch `sharedObjectRepository.set` to persist prefixed keys
  - upgrade support from host V6 → V7 via string replacement

Webview patch:
- `tools/workflow-fold/patcher.mjs` updates `patchWebviewBundleJs` to `CODEX_WORKFLOW_FOLD_PATCH_V11`.
- Workflow header uses `useSharedObject(...)` and `conversationId` to read/write persisted duration.

Remote installer:
- `docs/remote/codex-folding-install.mjs` updated to match host V7 + webview V11 markers and to verify the new markers.

## Testing

### Unit tests

Command:
- `npm test`

Coverage (high level):
- Verifies host patch includes `CODEX_WORKFLOW_FOLD_HOST_V7` and persistence markers.
- Verifies webview patch includes `CODEX_WORKFLOW_FOLD_PATCH_V11`, `useSharedObject`, `conversationId`, and timer key prefix.
- Existing behavioral tests (workflow folding + plan exclusion) remain passing.

### Local dry-run verification against installed extension artifacts

Command:
- `npm run verify`

Result (expected on a machine currently patched with older markers):
- Reports `PATCHED` for `out/extension.js` and `webview/assets/index-*.js` in dry-run mode, indicating an upgrade would be applied.

## OpenSpec record

OpenSpec change proposal created under:
- `openspec/changes/add-workflow-timer-persistence/`

Validation:
- `openspec validate add-workflow-timer-persistence --strict` (pass)

## Known Limitations / Follow-ups

- Key uses `workflow-${turnIndex}` (best-effort); if upstream rendering changes reorder turn indexing, persisted keys may not match old turns.
- Running turns are not resumed across restart; persistence is primarily for completed turn durations.

