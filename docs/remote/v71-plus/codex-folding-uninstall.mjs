#!/usr/bin/env node

function die(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

die([
  "[codex-workflow-folder] >=0.4.71 uninstall track placeholder",
  "This uninstaller is intentionally not implemented in this phase.",
  "Please wait for the dedicated 71+ implementation update.",
  "Placeholder path: docs/remote/v71-plus/codex-folding-uninstall.mjs",
].join("\n"));
