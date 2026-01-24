# Install Guide (For AI Operators)

> Goal: install “Workflow folding” into the installed Codex VS Code extension (`openai.chatgpt`) on Windows by applying an idempotent patch with backups.

## Preconditions

- VS Code installed
- Codex extension installed (Publisher: OpenAI, Extension id: `openai.chatgpt`)
- Node.js available in PATH

## Steps

1. Run tests
   - Command: `npm test`
   - Expected: PASS

2. Inspect compatibility (recommended)
   - Command: `node tools/workflow-fold/inspect.mjs`
   - Expected:
     - Prints the installed extension folder name (`openai.chatgpt-...`)
     - Prints the active webview bundle (`webview/assets/index-*.js`)
     - Prints whether a matching profile exists under `docs/patch-profiles/openai.chatgpt/<version>/` (preferred)
     - Prints anchor checks (so the AI can decide whether our patch logic is likely reusable)

3. Apply patch (creates `*.bak` backups once)
   - Command: `npm run apply`
   - Expected: outputs `PATCHED:` or `OK:` lines, no errors

4. Verify idempotence (no changes on second run)
   - Command: `npm run verify`

5. Configure default behavior
   - Edit `C:\Users\<USER>\.codex\config.toml`
   - Set:
     - `codex.workflow.collapseByDefault = "collapse"`
   - Values:
     - `"collapse"`: show Workflow and default collapsed
     - `"expand"`: show Workflow and default expanded
     - `"disable"`: disable feature (upstream behavior)

6. Restart VS Code

## What gets modified

- The script patches the installed extension build artifacts:
  - `out\extension.js` (injects a `<meta name="codex-workflow-collapse"...>` based on config)
  - `webview\assets\index-*.js` (injects Workflow folding behavior and renderer)
  - `webview\assets\zh-CN-*.js` (adds i18n strings)

See `docs/FILES_CHANGED_ABSOLUTE.md` for absolute paths on the author machine.
