# Install Guide (Direct Track) — `openai.chatgpt == 0.4.71`

> Use this direct track only when your local extension version is exactly `0.4.71`.

## Canonical script

- `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/remote/v71-plus/codex-folding-install.mjs`

## Behavior

- Adds click-to-fold behavior on the existing `Worked for {time}` row.
- Collapsed result keeps: `user-message` + `worked-for` + final `assistant-message`.
- Does not add a new `Workflow` bubble/label in the conversation list.
- Fold state persists only for current VS Code session.

## Strict version guard

- This direct script **fails fast** unless the installed extension is exactly `openai.chatgpt@0.4.71`.
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

3. Restart VS Code

## Verification hints

- Patched webview marker includes: `CODEX_WORKFLOW_FOLD_PATCH_V71_W1`
- Host marker includes: `CODEX_WORKFLOW_FOLD_HOST_V7`
