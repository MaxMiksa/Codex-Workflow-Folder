# Install Guide (Direct Track) — `openai.chatgpt == 0.4.71 | 0.4.73`

> Use this direct track only when your local extension version is exactly `0.4.71` or `0.4.73`.

## Canonical script

- `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/remote/v71-plus/codex-folding-install.mjs`

## Behavior

- Adds click-to-fold behavior on the existing `Worked for {time}` row.
- Collapsed result keeps: `user-message` + `worked-for` + final `assistant-message`.
- Does not add a new `Workflow` bubble/label in the conversation list.
- Fold state persists only for current VS Code session.

## Strict version guard

- This direct script **fails fast** unless the installed extension is exactly `openai.chatgpt@0.4.71` or `openai.chatgpt@0.4.73`.
- For automatic routing by version, use `docs/INSTALL_FOR_AI.md`.

## Steps

1. Download
   - Windows (PowerShell):
     - `Invoke-WebRequest -Uri "https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/remote/v71-plus/codex-folding-install.mjs" -OutFile "$env:TEMP\\codex-folding-install-v71.mjs"`
   - macOS/Linux (bash/zsh):
     - `curl -L "https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/remote/v71-plus/codex-folding-install.mjs" -o "${TMPDIR:-/tmp}/codex-folding-install-v71.mjs"`

2. Run
   - Windows: `node "$env:TEMP\\codex-folding-install-v71.mjs"`
   - macOS/Linux: `node "${TMPDIR:-/tmp}/codex-folding-install-v71.mjs"`

## Target resolution (strict by default)

- Installer scans `.vscode`, `.vscode-insiders`, `.vscode-oss` extension roots.
- If multiple highest-version candidates exist, it fails fast instead of guessing.
- If multiple `zh-CN-*.js` bundles exist and active entry cannot identify a unique one, it fails fast.
- Recommended command when ambiguous:
  - Windows: `node "$env:TEMP\\codex-folding-install-v71.mjs" --extDir "C:\\Users\\<YOU>\\.vscode\\extensions\\openai.chatgpt-0.4.71-win32-x64"`
  - macOS/Linux: `node "${TMPDIR:-/tmp}/codex-folding-install-v71.mjs" --extDir "$HOME/.vscode/extensions/openai.chatgpt-0.4.71-<platform>"`
- Optional fallback (not recommended): `--strictTarget=false`.

3. Restart VS Code

## Verification hints

- Patched webview marker includes:
  - `CODEX_WORKFLOW_FOLD_PATCH_V71_W1` (for `0.4.71`)
  - `CODEX_WORKFLOW_FOLD_PATCH_V73_W1` (for `0.4.73`)
- Host marker includes: `CODEX_WORKFLOW_FOLD_HOST_V7`
