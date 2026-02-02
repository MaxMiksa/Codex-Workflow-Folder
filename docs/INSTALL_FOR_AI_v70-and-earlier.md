# Install Guide (Direct Track) — `openai.chatgpt <= 0.4.70`

> Use this only when you explicitly want the legacy installer track.

## Canonical script

- `https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/remote/v70-and-earlier/codex-folding-install.mjs`

## Steps

1. Download
   - Windows (PowerShell):
     - `Invoke-WebRequest -Uri "https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/remote/v70-and-earlier/codex-folding-install.mjs" -OutFile "$env:TEMP\\codex-folding-install-v70.mjs"`
   - macOS/Linux (bash/zsh):
     - `curl -L "https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/remote/v70-and-earlier/codex-folding-install.mjs" -o "${TMPDIR:-/tmp}/codex-folding-install-v70.mjs"`

2. Run
   - Windows: `node "$env:TEMP\\codex-folding-install-v70.mjs"`
   - macOS/Linux: `node "${TMPDIR:-/tmp}/codex-folding-install-v70.mjs"`

3. Restart VS Code

## Notes

- If your local extension is `>=0.4.71`, this track intentionally fails.
- Default recommended entry remains `docs/INSTALL_FOR_AI.md` (auto-routing).
