## 1. Implementation

- [ ] 1.1 Add host-side persistence for shared-object keys prefixed with `codex.workflow.timer.`
- [ ] 1.2 Seed webview shared-object cache from persisted storage on webview creation
- [ ] 1.3 Update Workflow header timer to read persisted duration for completed turns and to write duration at completion
- [ ] 1.4 Keep behavior unchanged for running turns (still live refresh), and avoid overwriting historical durations

## 2. Validation

- [ ] 2.1 Unit tests: patcher injects host persistence markers and webview persistence hook usage
- [ ] 2.2 Local dry-run verify against installed extension artifacts

