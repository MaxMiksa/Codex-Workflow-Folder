# Uninstall Guide (For AI Operators) — Remote-First (No Clone)

> Goal: uninstall “Workflow folding” from the installed Codex VS Code extension (`openai.chatgpt`) on Windows/macOS/Linux by restoring original files from `*.bak` backups (created during install).

## Canonical URLs (this is the source of truth)

- This file: `https://github.com/MaxMiksa/Codex-Workflow-Folder/blob/main/docs/UNINSTALL_FOR_AI.md`
- Remote uninstall script (single file):
  - Latest release (pinned): `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/v1.2.0/docs/remote/codex-folding-uninstall.mjs`
  - Latest main (recommended for cross-platform): `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/remote/codex-folding-uninstall.mjs`
- Manual (for user to save): `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/AI_OPERATOR_MANUAL.md`

## Preconditions

- VS Code installed
- Codex extension installed (Publisher: OpenAI, Extension id: `openai.chatgpt`)
- Node.js available in PATH
- A shell to run the commands:
  - Windows: PowerShell
  - macOS/Linux: bash/zsh (any POSIX shell)

## Strict Rules (anti-improvisation)

- Do NOT clone the repo.
- Do NOT “re-implement” uninstall logic.
- Only download and run the provided remote script.

## Steps (what to do)

1. Download the remote uninstall script
   - Windows (PowerShell):
     - `Invoke-WebRequest -Uri "https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/remote/codex-folding-uninstall.mjs" -OutFile "$env:TEMP\\codex-folding-uninstall.mjs"`
     - If `raw.githubusercontent.com` is blocked: `Invoke-WebRequest -Uri "https://github.com/MaxMiksa/Codex-Workflow-Folder/raw/main/docs/remote/codex-folding-uninstall.mjs" -OutFile "$env:TEMP\\codex-folding-uninstall.mjs"`
   - macOS/Linux (bash/zsh):
     - `curl -L "https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/remote/codex-folding-uninstall.mjs" -o "${TMPDIR:-/tmp}/codex-folding-uninstall.mjs"`
     - If `raw.githubusercontent.com` is blocked: `curl -L "https://github.com/MaxMiksa/Codex-Workflow-Folder/raw/main/docs/remote/codex-folding-uninstall.mjs" -o "${TMPDIR:-/tmp}/codex-folding-uninstall.mjs"`

2. Run uninstall script (restores installed extension artifacts from `*.bak`)
   - Windows (PowerShell): `node "$env:TEMP\\codex-folding-uninstall.mjs"`
   - macOS/Linux (bash/zsh): `node "${TMPDIR:-/tmp}/codex-folding-uninstall.mjs"`
   - Expected behavior:
     - Finds the installed extension folder under one of:
       - `~/.vscode/extensions/openai.chatgpt-*` (VS Code Stable)
       - `~/.vscode-insiders/extensions/openai.chatgpt-*` (VS Code Insiders)
       - `~/.vscode-oss/extensions/openai.chatgpt-*` (some OSS builds / VSCodium)
     - Restores 2–3 files from their `*.bak` backups (if present)
       - `zh-CN-*.js` may be absent on some builds; the uninstaller will warn and continue
     - Verifies patch markers are absent after restore
     - Prints absolute paths of restored files

3. Restart VS Code
   - Required for the extension webview to pick up restored files.

## Notes

- This uninstall does NOT delete `*.bak` backups.
- The uninstall script does not modify VS Code settings; it only restores patched extension files.


