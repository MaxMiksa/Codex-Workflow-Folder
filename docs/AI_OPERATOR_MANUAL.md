# Codex Folding — AI Operator Manual (Single Source of Truth)

This manual is designed for an AI agent to perform a deterministic install/uninstall on Windows with minimal guesswork.

## Goal

Install **Workflow folding** into the Codex VS Code extension (`openai.chatgpt`) so that each turn shows:
1) user message (unchanged)
2) `Workflow` folding row (new)
3) final answer (unchanged)

All pre-final process items (reasoning/tool calls/tool output/status/error items) must be inside the `Workflow` fold.

## Preconditions

- Windows
- VS Code installed
- Codex extension installed: Publisher `OpenAI`, Extension id `openai.chatgpt`
- Node.js available (no dependencies required for this repo’s scripts)

## Parameters (config)

- Config file: `%USERPROFILE%\.codex\config.toml`
- Key: `codex.workflow.collapseByDefault`
- Values:
  - `"collapse"`: show Workflow, default collapsed
  - `"expand"`: show Workflow, default expanded
  - `"disable"`: disable feature (upstream behavior)
- Default: missing key is treated as `"disable"`
- Note: VS Code restart is required after config changes.

## Install Steps (deterministic)

1. Clone repo
   - `git clone https://github.com/MaxMiksa/Codex-Folding.git`
   - `cd Codex-Folding`

2. Run unit tests
   - `npm test`

3. Inspect local environment & compatibility
   - Run: `node tools/workflow-fold/inspect.mjs`
   - The inspector must:
     - detect installed extension dir under `%USERPROFILE%\.vscode\extensions\openai.chatgpt-*`
     - read extension `package.json` for version (if available)
     - find the active webview bundle referenced by `webview/index.html`
     - report whether there is a matching profile under `docs/patch-profiles/openai.chatgpt/<version>/`

4. Apply patch (creates backups once)
   - `npm run apply`
   - Must create backups `*.bak` next to each modified file (only if missing).

5. Configure default collapse
   - Ensure `%USERPROFILE%\.codex\config.toml` contains:
     - `codex.workflow.collapseByDefault = "collapse"`

6. Restart VS Code

7. Verify install
   - `npm run verify`
   - Confirm:
     - `Workflow` appears per turn
     - timer updates while running
     - expanded workflow preserves original content rendering

## Uninstall Steps (deterministic)

1. Locate the installed extension directory:
   - `%USERPROFILE%\.vscode\extensions\openai.chatgpt-*`

2. Restore originals from backups (do not delete backups)
   - Restore:
     - `out\extension.js` from `out\extension.js.bak`
     - active `webview\assets\index-*.js` from its `.bak`
     - `webview\assets\zh-CN-*.js` from its `.bak`

3. Restart VS Code

4. Verify uninstall
   - Ensure markers are absent:
     - `CODEX_WORKFLOW_FOLD_PATCH`
     - `codex-workflow-collapse`

## What files are modified (installed extension)

The patch touches exactly 3 installed files (plus backups):
- `out/extension.js`
- `webview/assets/index-*.js` (the entry referenced by `webview/index.html`)
- `webview/assets/zh-CN-*.js`

The exact injected snippets are documented here:
- `docs/patch-profiles/openai.chatgpt/0.4.66-win32-x64/INJECTION_host_extension.js.txt`
- `docs/patch-profiles/openai.chatgpt/0.4.66-win32-x64/INJECTION_webview_index.js.txt`
- `docs/patch-profiles/openai.chatgpt/0.4.66-win32-x64/INJECTION_zh-CN.js.txt`

For absolute path examples and the author machine’s recorded changes:
- `docs/FILES_CHANGED_ABSOLUTE.md`

## Version mismatch strategy (required AI behavior)

If the user’s installed `openai.chatgpt` extension version does not match a profile folder:

1. Inspect and compare (no modifications yet)
   - Run `node tools/workflow-fold/inspect.mjs` and read:
     - folder name, extension version, active webview bundle
     - whether the key anchors exist in the target files
2. Decide:
   - If anchors are present and semantics match the profile’s injection docs, proceed with `npm run apply`.
   - If anchors are missing or target code structure differs materially, STOP and report:
     - which anchor(s) are missing
     - what changed in the target file(s)
     - recommendation: pin extension version or add a new profile under `docs/patch-profiles/openai.chatgpt/<version>/`
