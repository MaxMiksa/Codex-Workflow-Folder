# Codex Workflow Folder — AI Operator Manual (Single Source of Truth)

This manual is written for an AI agent to perform a deterministic install/uninstall on Windows/macOS/Linux with minimal guesswork.

## What this does (context for AI)

It folds *all pre-final process items* (thinking/tool calls/tool output/status/error) into a per-turn `Workflow` expandable row, so the final answer stays clean. When expanded, the content renders exactly as upstream (no extra UI changes besides the `Workflow` row).

## Version Routing (important)

This project now uses version-separated tracks:

- `openai.chatgpt <= 0.4.70`: legacy installer/uninstaller track (`v70-and-earlier`) in active use.
- `openai.chatgpt >= 0.4.71`: dedicated track (`v71-plus`) reserved for new implementation.

Current phase note: `v71-plus` scripts are placeholders and intentionally exit with a clear error.

## Canonical URLs (remote-first, no clone)

- Manual (this file): `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/AI_OPERATOR_MANUAL.md`
- Install guide: `https://github.com/MaxMiksa/Codex-Workflow-Folder/blob/main/docs/INSTALL_FOR_AI.md`
- Uninstall guide: `https://github.com/MaxMiksa/Codex-Workflow-Folder/blob/main/docs/UNINSTALL_FOR_AI.md`
- Remote install script:
  - Latest release (pinned): `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/v1.2.0/docs/remote/codex-folding-install.mjs`
  - Latest main (recommended for cross-platform): `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/remote/codex-folding-install.mjs`
  - Legacy direct track (`<=0.4.70`): `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/remote/v70-and-earlier/codex-folding-install.mjs`
  - 71+ placeholder track: `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/remote/v71-plus/codex-folding-install.mjs`
- Remote uninstall script:
  - Latest release (pinned): `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/v1.2.0/docs/remote/codex-folding-uninstall.mjs`
  - Latest main (recommended for cross-platform): `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/remote/codex-folding-uninstall.mjs`
  - Legacy direct track (`<=0.4.70`): `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/remote/v70-and-earlier/codex-folding-uninstall.mjs`
  - 71+ placeholder track: `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/remote/v71-plus/codex-folding-uninstall.mjs`
  - If `raw.githubusercontent.com` is blocked:
    - Install: `https://github.com/MaxMiksa/Codex-Workflow-Folder/raw/main/docs/remote/codex-folding-install.mjs`
    - Uninstall: `https://github.com/MaxMiksa/Codex-Workflow-Folder/raw/main/docs/remote/codex-folding-uninstall.mjs`

## Goal / Scope (strict)

Per turn (per user message), the UI becomes:
1) user message (unchanged)
2) `Workflow` folding row (new)
3) final answer (unchanged)

Rule: “Workflow” must contain everything before the final answer (reasoning/tool calls/tool output/status/errors). It is acceptable to occasionally show an empty `Workflow`.

## Preconditions

- VS Code installed
- Codex extension installed (Publisher: OpenAI, Extension id: `openai.chatgpt`)
- Node.js available in PATH
- A shell to run the commands:
  - Windows: PowerShell
  - macOS/Linux: bash/zsh (any POSIX shell)

## Parameters (VS Code settings)

- Recommended setting location: VS Code `settings.json` (JSONC; comments allowed)
- Key: `codex.workflow.collapseByDefault`
- Values:
  - `"collapse"`: show Workflow, default collapsed
  - `"expand"`: show Workflow, default expanded
  - `"disable"`: disable feature (upstream behavior)
- Default behavior: if unset (or the injected `<meta>` is missing), the patched webview defaults to `"collapse"` (so the feature works without extra configuration)
- Restart: VS Code restart is required after changes

## Install / Uninstall (deterministic)

Do not clone. Use the remote scripts only:
- Install: download + run `codex-folding-install.mjs` (patches 3 files + creates `*.bak` + writes config comment + saves this manual for the user)
- Uninstall: download + run `codex-folding-uninstall.mjs` (restores from `*.bak`)

## What gets modified on the user machine (strict)

- Installed extension build artifacts (plus `*.bak` backups):
  - `out/extension.js`
  - `webview/assets/index-*.js` (the active bundle referenced by `webview/index.html`)
  - `webview/assets/zh-CN-*.js` (if present)
- VS Code settings (optional):
  - Optional: set `codex.workflow.collapseByDefault` to control behavior; uninstall does not modify settings.

## Verification markers (for AI checks)

- Patched host file must include: `codex-workflow-collapse`
- Patched webview file must include: `CODEX_WORKFLOW_FOLD_PATCH`
- Patched webview file should include: `CODEX_WORKFLOW_FOLD_PATCH_V10` (tighten workflow spacing + child gap)
- Patched `zh-CN` locale file (if present) must include: `codex.workflow.label`

## Version mismatch strategy (required AI behavior)

If the installed `openai.chatgpt` version is not exactly what this repo was tested on:

1. Inspect local installed files (read-only)
   - Find the active extension folder under one of:
     - `~/.vscode/extensions/openai.chatgpt-*` (VS Code Stable)
     - `~/.vscode-insiders/extensions/openai.chatgpt-*` (VS Code Insiders)
     - `~/.vscode-oss/extensions/openai.chatgpt-*` (some OSS builds / VSCodium)
   - Find the active webview entry bundle referenced by `webview/index.html`
   - Read the three target files and see whether the patch anchors can be applied (the installer script will report failures)
2. Route by version first:
   - `<=0.4.70`: continue with legacy track.
   - `>=0.4.71`: route to `v71-plus` track (placeholder in this phase; should fail fast with a clear message).

3. Only for active track (`<=0.4.70`) decide compatibility:
   - If the same patch logic can be applied safely (anchors found; verification markers appear after patch), proceed.
   - If patch logic cannot be reused (anchors missing / structure materially different), STOP and explain what differs and what would be required (e.g. pin extension version or create a new patch profile).







