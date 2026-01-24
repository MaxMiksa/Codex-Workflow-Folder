# Workflow Folding (VS Code Codex Extension) — Implementation Plan

> **For Claude/Codex:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Add a per-turn `Workflow` fold line that collapses all pre-final-output process items in the Codex VS Code extension UI, controlled by `C:\Users\Max\.codex\config.toml`.

**Architecture:** Patch the installed extension’s build artifacts (extension host JS + webview bundle + zh-CN locale bundle) by injecting a small wrapper that:
- Reads `codex.workflow.collapseByDefault = "collapse" | "expand" | "disable"` from `config.toml` (default `disable`).
- Injects this mode into the webview via a `<meta name="codex-workflow-collapse" ...>` tag.
- Wraps `mapStateToLocalConversationItems` to group per-turn “process items” into a synthetic `workflow` item.
- Overrides `LocalConversationItemContent` to render the `workflow` item using existing components, preserving the original content rendering when expanded.

**Tech Stack:** Node.js (patch scripts + tests), VS Code extension runtime (existing host/webview bundles).

## Task 1: Add string-patch unit tests (TDD)

**Files:**
- Create: `tools/workflow-fold/patcher.mjs`
- Create: `tools/workflow-fold/patcher.test.mjs`

**Step 1: Write failing tests**
- Assert host patch injects `codex-workflow-collapse` meta tag.
- Assert webview patch injects `CODEX_WORKFLOW_FOLD_PATCH` marker + `workflow` support.
- Assert zh-CN locale patch injects `codex.workflow.*` keys.

**Step 2: Run tests to verify RED**
- Run: `node --test tools/workflow-fold/patcher.test.mjs`
- Expected: failing assertions (before implementing patch functions).

**Step 3: Implement minimal patch functions (GREEN)**
- Implement idempotent string insertions for:
  - `out/extension.js` (host meta injection + config.toml parsing)
  - `webview/assets/index-*.js` (workflow folding + rendering injection)
  - `webview/assets/zh-CN-*.js` (translations)

**Step 4: Run tests to verify GREEN**
- Run: `node --test tools/workflow-fold/patcher.test.mjs`
- Expected: PASS

## Task 2: Create an apply script with backups

**Files:**
- Create: `tools/workflow-fold/apply.mjs`

**Steps:**
1. Detect latest installed extension dir under `%USERPROFILE%\.vscode\extensions\openai.chatgpt-*`.
2. Locate:
   - `out/extension.js`
   - `webview/index.html` → extract `webview/assets/index-*.js`
   - `webview/assets/zh-CN-*.js`
3. Backup originals to `*.bak` (only once).
4. Patch in place, then verify markers.

**Run:**
- Apply + verify: `node tools/workflow-fold/apply.mjs --verify`
- Idempotence check: `node tools/workflow-fold/apply.mjs --dry-run --verify`

## Task 3: Manual verification checklist (VS Code)

1. Set `C:\Users\Max\.codex\config.toml`:
   - `codex.workflow.collapseByDefault = "collapse"` → default folded with `Workflow` line.
   - `codex.workflow.collapseByDefault = "expand"` → default expanded.
   - `codex.workflow.collapseByDefault = "disable"` (or missing) → behavior matches upstream.
2. Restart VS Code.
3. Create a thread that triggers tools (shell commands / plan / patch).
4. Confirm:
   - Each turn gets its own `Workflow` section.
   - Fold/unfold state is per-turn and not persisted across turns.
   - Elapsed time updates while running.
   - Expanded content matches the original item rendering.

