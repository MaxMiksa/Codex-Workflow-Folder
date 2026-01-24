# Uninstall Guide (For AI Operators)

> Goal: uninstall “Workflow folding” by restoring original installed extension files from the `*.bak` backups created during install.

## Steps

1. Locate the installed extension directory
   - Base: `%USERPROFILE%\.vscode\extensions\`
   - Target pattern: `openai.chatgpt-*`

2. Restore originals from backups (if present)
   - Restore `out\extension.js` from `out\extension.js.bak`
   - Restore the active webview bundle referenced by `webview\index.html`:
     - Example: `webview\assets\index-xxxx.js` from `webview\assets\index-xxxx.js.bak`
   - Restore `webview\assets\zh-CN-*.js` from `webview\assets\zh-CN-*.js.bak`

3. Verify uninstall
   - Confirm these markers are absent in the restored files:
     - `CODEX_WORKFLOW_FOLD_PATCH`
     - `codex-workflow-collapse`

4. Restart VS Code

## Notes

- Do not delete backups; keep `*.bak` in case you want to re-install quickly.
- If the extension version differs from what was originally patched, still restore using the `.bak` files that exist next to the currently installed targets (backup names are per-file, not per-version).
