# Install Guide (For AI Operators) — Remote-First (No Clone)

> Goal: install “Workflow folding” into the installed Codex VS Code extension (`openai.chatgpt`) on Windows by running a remote, deterministic patch script with backups.

**What this does (context for AI):** It folds *all pre-final process items* (thinking/tool calls/tool output/status/error) into a per-turn `Workflow` expandable row, so the final answer stays clean.

## Canonical URLs (this is the source of truth)

- This file: `https://github.com/MaxMiksa/Codex-Folding/blob/main/docs/INSTALL_FOR_AI.md`
- Remote install script (single file, pinned): `https://raw.githubusercontent.com/MaxMiksa/Codex-Folding/0c78b8b/docs/remote/codex-folding-install.mjs`
- Remote uninstall script (single file, pinned): `https://raw.githubusercontent.com/MaxMiksa/Codex-Folding/0c78b8b/docs/remote/codex-folding-uninstall.mjs`
- Manual (for user to save): `https://raw.githubusercontent.com/MaxMiksa/Codex-Folding/main/docs/AI_OPERATOR_MANUAL.md`

## Preconditions

- Windows + PowerShell
- VS Code installed
- Codex extension installed (Publisher: OpenAI, Extension id: `openai.chatgpt`)
- Node.js available in PATH

## Strict Rules (anti-improvisation)

- Do NOT clone the repo.
- Do NOT “re-implement” patch logic.
- Only download and run the provided remote script(s).
- If the script reports incompatible anchors, STOP and explain what is different.

## Steps (what to do)

1. Download the remote install script
   - Save to a temporary folder:
     - `Invoke-WebRequest -Uri "https://raw.githubusercontent.com/MaxMiksa/Codex-Folding/0c78b8b/docs/remote/codex-folding-install.mjs" -OutFile "$env:TEMP\\codex-folding-install.mjs"`

2. Run install script (patches extension + writes config hint)
   - `node "$env:TEMP\\codex-folding-install.mjs"`
   - Expected behavior:
     - Finds the installed extension folder under `%USERPROFILE%\\.vscode\\extensions\\openai.chatgpt-*`
     - Checks key anchors in the three target files (to decide compatibility)
     - Patches exactly 3 files and creates `*.bak` backups (only once)
     - Downloads this project’s AI manual and saves it to a user-friendly location (prefer `Downloads`) so the user can keep it
     - Prints absolute paths of modified files and backups

3. Restart VS Code
   - Required for the extension webview to pick up the config change.

## What gets modified on the user machine

- Installed extension build artifacts (plus `*.bak` backups):
  - `out\\extension.js`
  - `webview\\assets\\index-*.js` (the active bundle referenced by `webview\\index.html`)
  - `webview\\assets\\zh-CN-*.js`
- Codex config:
  - `%USERPROFILE%\\.codex\\config.toml`

## Why each step exists (purpose)

1. Download script: ensures “no-clone” and eliminates ambiguity about what code to run.
2. Run script: performs deterministic patching (3 files), creates backups for safe rollback, and writes the config key + comments so users can understand and modify the behavior later.
3. Restart VS Code: the extension/webview assets are loaded at runtime; restart is the simplest and most reliable way to pick up patched artifacts and config.







