# Install Guide (For AI Operators) — Remote-First (No Clone)

> Goal: install “Workflow folding” into the installed Codex VS Code extension (`openai.chatgpt`) on Windows/macOS/Linux by running a remote, deterministic patch script with backups.

**What this does (context for AI):**
- `<=0.4.70`: folds pre-final process items into a per-turn `Workflow` row.
- `==0.4.71`: adds click-to-fold on `Worked for {time}` to hide pre-final process items.

## Version Routing (important)

This project now separates install tracks by extension version:

- `openai.chatgpt <= 0.4.70`: uses the legacy track (`v70-and-earlier`) and is supported in this phase.
- `openai.chatgpt == 0.4.71`: routes to the `v71-plus` track and is supported in this phase.
- `openai.chatgpt > 0.4.71`: intentionally fails fast (not yet supported in this phase).

Default behavior: the main installer entry (`docs/remote/codex-folding-install.mjs`) auto-detects the local extension version and routes accordingly.

## Canonical URLs (this is the source of truth)

- This file: `https://github.com/MaxMiksa/Codex-Workflow-Folder/blob/main/docs/INSTALL_FOR_AI.md`
- Remote install script (single file):
  - Latest release (pinned): `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/v1.2.0/docs/remote/codex-folding-install.mjs`
  - Latest main (recommended for cross-platform): `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/remote/codex-folding-install.mjs`
  - Legacy direct track (`<=0.4.70`): `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/remote/v70-and-earlier/codex-folding-install.mjs`
  - 0.4.71 direct track: `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/remote/v71-plus/codex-folding-install.mjs`
- Remote uninstall script (single file):
  - Latest release (pinned): `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/v1.2.0/docs/remote/codex-folding-uninstall.mjs`
  - Latest main (recommended for cross-platform): `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/remote/codex-folding-uninstall.mjs`
  - Legacy direct track (`<=0.4.70`): `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/remote/v70-and-earlier/codex-folding-uninstall.mjs`
  - 0.4.71 direct track: `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/remote/v71-plus/codex-folding-uninstall.mjs`
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
- Do NOT “re-implement” patch logic.
- Only download and run the provided remote script(s).
- If the script reports incompatible anchors, STOP and explain what is different.

## Steps (what to do)

1. Download the remote install script
   - Windows (PowerShell):
     - `Invoke-WebRequest -Uri "https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/remote/codex-folding-install.mjs" -OutFile "$env:TEMP\\codex-folding-install.mjs"`
     - If `raw.githubusercontent.com` is blocked: `Invoke-WebRequest -Uri "https://github.com/MaxMiksa/Codex-Workflow-Folder/raw/main/docs/remote/codex-folding-install.mjs" -OutFile "$env:TEMP\\codex-folding-install.mjs"`
   - macOS/Linux (bash/zsh):
     - `curl -L "https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/remote/codex-folding-install.mjs" -o "${TMPDIR:-/tmp}/codex-folding-install.mjs"`
     - If `raw.githubusercontent.com` is blocked: `curl -L "https://github.com/MaxMiksa/Codex-Workflow-Folder/raw/main/docs/remote/codex-folding-install.mjs" -o "${TMPDIR:-/tmp}/codex-folding-install.mjs"`

2. Run install script (patches extension + saves manual)
   - Windows (PowerShell): `node "$env:TEMP\\codex-folding-install.mjs"`
   - macOS/Linux (bash/zsh): `node "${TMPDIR:-/tmp}/codex-folding-install.mjs"`
   - Expected behavior:
     - Finds the installed extension folder under one of:
       - `~/.vscode/extensions/openai.chatgpt-*` (VS Code Stable)
       - `~/.vscode-insiders/extensions/openai.chatgpt-*` (VS Code Insiders)
       - `~/.vscode-oss/extensions/openai.chatgpt-*` (some OSS builds / VSCodium)
     - Target resolution is strict by default:
       - If highest version cannot be uniquely determined, installer fails fast and prints candidates.
       - Use `--extDir <absolute-path-to-openai.chatgpt-*>` to remove ambiguity.
     - Checks key anchors in the three target files (to decide compatibility)
     - Patches 2–3 files and creates `*.bak` backups (only once)
       - `zh-CN-*.js` may be absent on some builds; the installer will warn and continue.
       - If multiple `zh-CN-*.js` exist and active entry cannot pick one uniquely, installer fails fast.
     - Downloads this project’s AI manual and saves it to a user-friendly location (prefer `Downloads`) so the user can keep it
     - Prints absolute paths of modified files and backups
     - Auto-routing result:
       - If version is `<=0.4.70`: continues with legacy installer logic.
       - If version is `==0.4.71`: applies the `Worked for` click-to-fold patch.
       - If version is `>0.4.71`: exits with explicit unsupported-version error.

### Ambiguity resolution flags

- Default mode is strict (`--strictTarget=true`), which avoids silent wrong-target patching.
- Preferred fix when install fails due to ambiguity:
  - Windows: `node "$env:TEMP\\codex-folding-install.mjs" --extDir "C:\\Users\\<YOU>\\.vscode\\extensions\\openai.chatgpt-0.4.71-win32-x64"`
  - macOS/Linux: `node "${TMPDIR:-/tmp}/codex-folding-install.mjs" --extDir "$HOME/.vscode/extensions/openai.chatgpt-0.4.71-<platform>"`
- Emergency fallback (not recommended): pass `--strictTarget=false` to allow legacy heuristic fallback.

3. Restart VS Code
   - Required for the extension webview to pick up patched artifacts.

## Optional: setting (easier than `.codex/config.toml`)

This project does **not** use `~/.codex/config.toml` anymore. The behavior is controlled via **VS Code Settings**:

- Key: `codex.workflow.collapseByDefault`
- Values:
  - `"collapse"`: show Workflow, default collapsed (recommended)
  - `"expand"`: show Workflow, default expanded
  - `"disable"`: disable feature (upstream behavior)
- Default: if unset (or the injected `<meta>` is missing), the patched webview behaves like `"collapse"`.

## What gets modified on the user machine

- Installed extension build artifacts (plus `*.bak` backups):
  - `out/extension.js`
  - `webview/assets/index-*.js` (the active bundle referenced by `webview/index.html`)
  - `webview/assets/zh-CN-*.js` (if present)
- VS Code settings (optional; installer does not modify it):
  - You may add `codex.workflow.collapseByDefault` to VS Code `settings.json` if you want `"expand"` or `"disable"`.

## Why each step exists (purpose)

1. Download script: ensures “no-clone” and eliminates ambiguity about what code to run.
2. Run script: performs deterministic patching (3 files), creates backups for safe rollback, and saves the manual for the user.
3. Restart VS Code: the extension/webview assets are loaded at runtime; restart is the simplest and most reliable way to pick up patched artifacts.

## Optional: direct track install links

Use these only when you explicitly want to bypass auto-routing:

- Legacy (`<=0.4.70`): `docs/remote/v70-and-earlier/codex-folding-install.mjs`
- 0.4.71 direct: `docs/remote/v71-plus/codex-folding-install.mjs`







