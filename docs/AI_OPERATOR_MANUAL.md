# Codex Folding — AI Operator Manual (Single Source of Truth)

This manual is written for an AI agent to perform a deterministic install/uninstall on Windows with minimal guesswork.

## What this does (context for AI)

It folds *all pre-final process items* (thinking/tool calls/tool output/status/error) into a per-turn `Workflow` expandable row, so the final answer stays clean. When expanded, the content renders exactly as upstream (no extra UI changes besides the `Workflow` row).

## Canonical URLs (remote-first, no clone)

- Manual (this file): `https://raw.githubusercontent.com/MaxMiksa/Codex-Folding/main/docs/AI_OPERATOR_MANUAL.md`
- Install guide: `https://github.com/MaxMiksa/Codex-Folding/blob/main/docs/INSTALL_FOR_AI.md`
- Uninstall guide: `https://github.com/MaxMiksa/Codex-Folding/blob/main/docs/UNINSTALL_FOR_AI.md`
- Remote install script (pinned): `https://raw.githubusercontent.com/MaxMiksa/Codex-Folding/0c78b8b/docs/remote/codex-folding-install.mjs`
- Remote uninstall script (pinned): `https://raw.githubusercontent.com/MaxMiksa/Codex-Folding/0c78b8b/docs/remote/codex-folding-uninstall.mjs`

## Goal / Scope (strict)

Per turn (per user message), the UI becomes:
1) user message (unchanged)
2) `Workflow` folding row (new)
3) final answer (unchanged)

Rule: “Workflow” must contain everything before the final answer (reasoning/tool calls/tool output/status/errors). It is acceptable to occasionally show an empty `Workflow`.

## Preconditions

- Windows + PowerShell
- VS Code installed
- Codex extension installed (Publisher: OpenAI, Extension id: `openai.chatgpt`)
- Node.js available in PATH

## Parameters (config.toml)

- Config file: `%USERPROFILE%\\.codex\\config.toml`
- Key: `codex.workflow.collapseByDefault`
- Values:
  - `"collapse"`: show Workflow, default collapsed
  - `"expand"`: show Workflow, default expanded
  - `"disable"`: disable feature (upstream behavior)
- Accepted TOML forms (equivalent):
  - Dotted key: `codex.workflow.collapseByDefault = "collapse"`
  - Table form:
    - `[codex.workflow]`
    - `collapseByDefault = "collapse"`
- Default behavior: missing key is treated as `"disable"`
- Restart: VS Code restart is required after config changes

## Install / Uninstall (deterministic)

Do not clone. Use the remote scripts only:
- Install: download + run `codex-folding-install.mjs` (patches 3 files + creates `*.bak` + writes config comment + saves this manual for the user)
- Uninstall: download + run `codex-folding-uninstall.mjs` (restores from `*.bak`)

## What gets modified on the user machine (strict)

- Installed extension build artifacts (plus `*.bak` backups):
  - `out\\extension.js`
  - `webview\\assets\\index-*.js` (the active bundle referenced by `webview\\index.html`)
  - `webview\\assets\\zh-CN-*.js`
- Codex config:
  - `%USERPROFILE%\\.codex\\config.toml` (install adds comments + sets `codex.workflow.collapseByDefault = "collapse"`; uninstall removes the key line so default becomes `"disable"`)

## Verification markers (for AI checks)

- Patched host file must include: `codex-workflow-collapse`
- Patched webview file must include: `CODEX_WORKFLOW_FOLD_PATCH`
- Patched `zh-CN` locale file must include: `codex.workflow.label`

## Version mismatch strategy (required AI behavior)

If the installed `openai.chatgpt` version is not exactly what this repo was tested on:

1. Inspect local installed files (read-only)
   - Find the active extension folder under `%USERPROFILE%\\.vscode\\extensions\\openai.chatgpt-*`
   - Find the active webview entry bundle referenced by `webview\\index.html`
   - Read the three target files and see whether the patch anchors can be applied (the installer script will report failures)
2. Decide:
   - If the same patch logic can be applied safely (anchors found; verification markers appear after patch), proceed.
   - If patch logic cannot be reused (anchors missing / structure materially different), STOP and explain what differs and what would be required (e.g. pin extension version or create a new patch profile).







