# SDD — Codex Folding (Workflow Folding)

## Overview

This project patches the installed Codex VS Code extension artifacts instead of building from source.

## Components

- Host patch (`out/extension.js`)
  - Reads `C:\Users\<USER>\.codex\config.toml` for `codex.workflow.collapseByDefault`
  - Injects `<meta name="codex-workflow-collapse" content="...">` into webview HTML

- Webview patch (`webview/assets/index-*.js`)
  - Wraps `mapStateToLocalConversationItems` to fold per-turn items into a synthetic `workflow` item
  - Wraps `LocalConversationItemContent` to render `workflow` via existing UI components
  - Timer refresh every 1s while running

- Locale patch (`webview/assets/zh-CN-*.js`)
  - Adds a few `codex.workflow.*` i18n keys

## Safety / Reversibility

- `tools/workflow-fold/apply.mjs` creates `*.bak` backups once, then patches in place.
- Uninstall is restoring from backups.

