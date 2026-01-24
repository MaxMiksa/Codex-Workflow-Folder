# AGENTS.md (Repo Root)

This repository is a staging area for adding a new feature to the Codex VS Code extension.

## Encoding Safety
- Always read and write text files using UTF-8 **without BOM**.
- Avoid non-UTF-8 scripts or shell replacements when touching Chinese/localized text.
- Prefer structured edits (e.g. `apply_patch`) for localized strings.

## Verification
- After editing Chinese/localized text, re-open the file to confirm characters render correctly.
- Before delivering changes, prefer running `npm run build` (in the target repo being modified) to confirm there are no other issues.
  - Note: this repo uses `npm test` / `npm run apply` / `npm run verify` for validation (it patches installed extension artifacts).

## Prevent Repeating Mistakes
When you repeatedly hit the same kind of friction while coding or using tools, write a short note into this `AGENTS.md` (or the nearest scoped `AGENTS.md`).

Template (keep each field 1–3 lines):
- Symptom:
- Cause:
- Fix:

Privacy: never write secrets (tokens/keys) in plaintext; use placeholders like `<TOKEN>`.

## Notes (Gotchas)
- Symptom: `cd /d <path>` fails in PowerShell with “positional parameter cannot be found”.
  Cause: `cd /d` is `cmd.exe` syntax, not PowerShell.
  Fix: Use `Set-Location '<path>'` (or `cd '<path>'`) in PowerShell.

- Symptom: Unix helpers like `head`, `nl`, `sed` are “not recognized” in PowerShell.
  Cause: They are not built-in Windows/PowerShell commands (unless extra tooling is installed).
  Fix: Prefer PowerShell equivalents like `... | Select-Object -First N` and `Get-Content` with indexing.
