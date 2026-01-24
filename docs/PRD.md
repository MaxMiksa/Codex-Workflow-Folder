# PRD — Codex Folding (Workflow Folding)

## Background

The Codex VS Code extension shows a long, verbose “thinking + tool execution” stream before the final answer, which is time-consuming to scroll and visually noisy.

## Goal

Add a per-turn `Workflow` folding header that collapses all pre-final process items by default (configurable), while keeping the final answer unchanged and preserving the original rendering when expanded.

## Scope

- In scope:
  - Per-turn `Workflow` folding line inserted between user message and final answer.
  - Collapse/expand state is per-turn and does not persist across turns or restarts.
  - Live timer (1s updates) and basic status (`Working`/`Done`).
  - Config switch: `codex.workflow.collapseByDefault = "collapse" | "expand" | "disable"` (default `disable`).
- Out of scope:
  - Any redesign of existing process item rendering.
  - Accessibility/keyboard navigation improvements.

## Success Criteria

- Default UI shows user input + `Workflow` line + final answer.
- Expanded `Workflow` shows the same process content as before the patch.
- Feature can be disabled fully (no UI changes) via config.
- Install/uninstall can be executed reliably by an AI operator (with backups).

