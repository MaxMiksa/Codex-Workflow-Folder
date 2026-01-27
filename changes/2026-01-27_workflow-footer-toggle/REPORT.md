# Workflow Footer Toggle Row — Dev & Test Report

Date: 2026-01-27  
Branch: `feature/workflow-footer-toggle`

## Goal

In expanded state, add a bottom “footer” row identical to the top Workflow header row so users can collapse long workflows without scrolling back to the top.

Constraints:
- Collapsed state remains unchanged (only the top header row).
- Expanded state shows: top header + expanded content + bottom footer row.
- Footer/header content and styling match; separators are symmetric (footer introduces a bottom divider).

## Design

- Implemented as a second `button` rendered only when `expanded` exists.
- Footer uses the same `row` content object as the header (label + status/time + chevron).
- Footer adds `border-t` to create a symmetric separator against the expanded content.

## Implementation

- Webview patch version bump: `CODEX_WORKFLOW_FOLD_PATCH_V12`
- Files:
  - `tools/workflow-fold/patcher.mjs`: adds footer rendering and version marker
  - `docs/remote/codex-folding-install.mjs`: updates patch marker expectations and injected patch block
  - `tools/workflow-fold/patcher.test.mjs`: updates expectations and asserts footer injection
  - `docs/RESEARCH_workflow-footer-toggle.md`: research + decision log

## Testing

### Unit tests

- `npm test` (pass)

### Local verification

- `npm run verify` (dry-run, pass)
  - Reports `PATCHED` for `out/extension.js` + active `index-*.js` bundle (expected when installed extension has older markers).

## OpenSpec record

- `openspec/changes/add-workflow-footer-toggle/`
- `openspec validate add-workflow-footer-toggle --strict` (pass)

