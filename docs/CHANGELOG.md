## v0.5.0 – Workflow Folding Patch Release (2026-01-24)

### Feature 1: Per-turn Workflow Folding
- **Summary**: Adds a `Workflow` folding row to the Codex VS Code extension that collapses all pre-final “process items” into a single expandable block.
- **Problem Solved**: The original UI can be extremely long due to reasoning/tool output, making threads hard to read and navigate.
- **Feature Details**:
  - Inserts a `Workflow` line between user input and final answer for each turn.
  - The workflow includes all process items (reasoning, exec, patch, tool calls, plans, status/error items).
  - Expanded view preserves the original rendering of all items.
  - Shows status and elapsed time (updates every 1s while running); state is per-turn and not persisted across turns/restarts.
- **Technical Implementation**:
  - Patch-based delivery against installed extension artifacts:
    - `tools/workflow-fold/patcher.mjs`: idempotent string injections for host/webview/i18n bundles
    - `tools/workflow-fold/apply.mjs`: finds extension dir, creates `*.bak` backups, applies patch
  - Webview injection wraps existing entry points:
    - wraps `mapStateToLocalConversationItems` to add a synthetic `workflow` item
    - wraps `LocalConversationItemContent` to render the `workflow` container and reuse original item components

### Feature 2: 3-state Config Switch (collapse / expand / disable)
- **Summary**: Adds `codex.workflow.collapseByDefault` with `collapse|expand|disable` (default `disable`).
- **Problem Solved**: Users can opt into folding without forcing a single default behavior.
- **Feature Details**:
  - `"collapse"`: show Workflow and default collapsed
  - `"expand"`: show Workflow and default expanded
  - `"disable"` or missing: no UI changes (upstream behavior)
- **Technical Implementation**:
  - Host-side injects a `<meta name="codex-workflow-collapse"...>` for the webview to read (value from `C:\Users\<USER>\.codex\config.toml`).

