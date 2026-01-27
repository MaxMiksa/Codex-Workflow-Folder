# Uninstall Guide (For AI Operators) — Remote-First (No Clone)

> Goal: uninstall “Workflow folding” from the installed Codex VS Code extension (`openai.chatgpt`) on Windows by restoring original files from `*.bak` backups (created during install).

## Canonical URLs (this is the source of truth)

- This file: `https://github.com/MaxMiksa/Codex-Workflow-Folder/blob/main/docs/UNINSTALL_FOR_AI.md`
- Remote uninstall script (single file, pinned): `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/v1.1.0/docs/remote/codex-folding-uninstall.mjs`
- Manual (for user to save): `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/AI_OPERATOR_MANUAL.md`

## Preconditions

- Windows + PowerShell
- VS Code installed
- Codex extension installed (Publisher: OpenAI, Extension id: `openai.chatgpt`)
- Node.js available in PATH

## Strict Rules (anti-improvisation)

- Do NOT clone the repo.
- Do NOT “re-implement” uninstall logic.
- Only download and run the provided remote script.

## Steps (what to do)

1. Download the remote uninstall script
   - `Invoke-WebRequest -Uri "https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/v1.1.0/docs/remote/codex-folding-uninstall.mjs" -OutFile "$env:TEMP\\codex-folding-uninstall.mjs"`
   - If `raw.githubusercontent.com` is blocked in the user’s network, use GitHub’s alternative raw endpoint:
     - `Invoke-WebRequest -Uri "https://github.com/MaxMiksa/Codex-Workflow-Folder/raw/v1.1.0/docs/remote/codex-folding-uninstall.mjs" -OutFile "$env:TEMP\\codex-folding-uninstall.mjs"`

2. Run uninstall script (restores installed extension artifacts from `*.bak`)
   - `node "$env:TEMP\\codex-folding-uninstall.mjs"`
   - Expected behavior:
     - Finds the installed extension folder under `%USERPROFILE%\\.vscode\\extensions\\openai.chatgpt-*`
     - Restores exactly 3 files from their `*.bak` backups (if present)
     - Verifies patch markers are absent after restore
     - Prints absolute paths of restored files

3. Restart VS Code
   - Required for the extension webview to pick up restored files.

## Notes

- This uninstall does NOT delete `*.bak` backups.
- The uninstall script does not modify VS Code settings; it only restores patched extension files.


