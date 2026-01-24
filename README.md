# Codex Folding | [中文说明](README-zh.md)

[![Version](https://img.shields.io/badge/version-v0.5.0-blue.svg)](#)
[![VS%20Code](https://img.shields.io/badge/VS%20Code-extension-007ACC.svg)](#)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

✅ **Per-turn Workflow folding | 3-state config.toml switch | One-command install/uninstall for AI**  
✅ **Collapse noisy “thinking & tool output” | Keep final answer clean**  
✅ **Windows | Codex VS Code extension `openai.chatgpt`**  

A small patch-based add-on that folds the Codex VS Code extension’s pre-final “workflow” into a single expandable line, without changing the original rendering when expanded.

<p align="center">
  <img src="Presentation/demo.png" width="720" alt="Workflow folding demo (placeholder)" />
</p>

## Features

| Feature (Emoji + Name) | Description |
| :--- | :--- |
| 🧩 Workflow Folding | Groups all pre-final process items into a per-turn `Workflow` block. |
| ⏱️ Live Timer | Shows `Working/Done` and updates elapsed time every 1s while running. |
| ⚙️ Config Switch | `codex.workflow.collapseByDefault = "collapse" | "expand" | "disable"`, default `disable`. |
| 🧯 Safe & Reversible | Creates `*.bak` backups and is idempotent. |

## Usage Guide (Happy Path)

1. Ask your AI to install using the prompt below.
2. Set `C:\Users\<YOU>\.codex\config.toml`:
   - `codex.workflow.collapseByDefault = "collapse"`
3. Restart VS Code.

## AI Install/Uninstall Prompts

### Install Prompt (give to AI)
```text
You are an AI coding assistant running locally on my Windows machine.

Goal: install Codex Folding (Workflow folding) for the Codex VS Code extension.

Constraints:
- Do not ask for approvals; run commands directly.
- Use UTF-8 without BOM for any text files you create/modify.
- Create backups of any modified VS Code extension files (keep *.bak).

Steps:
1) In this repo, run: `npm test`
2) Apply the patch to the installed extension: `npm run apply`
3) Verify idempotence: `npm run verify`
4) Tell me to edit `C:\Users\<ME>\.codex\config.toml` and set:
   `codex.workflow.collapseByDefault = "collapse"`
5) Tell me to restart VS Code.
6) Output the absolute paths of modified files and their backups.
```

### Uninstall Prompt (give to AI)
```text
You are an AI coding assistant running locally on my Windows machine.

Goal: uninstall Codex Folding (restore original Codex VS Code extension files).

Constraints:
- Restore from existing *.bak backups created during install.
- Do not delete backups; only restore originals.

Steps:
1) Find the installed extension directory under:
   `%USERPROFILE%\.vscode\extensions\openai.chatgpt-*`
2) Restore these files from their `.bak` backups if present:
   - `out\extension.js`
   - `webview\assets\index-*.js` (the active index bundle referenced by `webview\index.html`)
   - `webview\assets\zh-CN-*.js`
3) Verify that `CODEX_WORKFLOW_FOLD_PATCH` and `codex-workflow-collapse` are gone.
4) Tell me to restart VS Code.
5) Output the absolute paths restored.
```

<details>
  <summary>Requirements & Limits</summary>

- This project patches the installed extension build artifacts (no upstream source build required).
- VS Code must be restarted after changing `config.toml`.
</details>

<details>
  <summary>Developer Guide</summary>

- Run tests: `npm test`
- Apply patch: `npm run apply`
- Verify (no-op): `npm run verify`
</details>

<details>
  <summary>Development Stack</summary>

1. Packages & Frameworks
   - Node.js (ESM)
2. Interfaces & Services
   - VS Code extension host JS + webview bundle patching
3. Languages
   - JavaScript, Markdown
</details>

<details>
  <summary>FAQ / Troubleshooting</summary>

- If nothing changes after config edits, restart VS Code.
- If VS Code updates the extension, re-run `npm run apply`.
</details>

## 🤝 Contribution & Contact

Welcome to submit Issues and Pull Requests!
Any questions or suggestions? Please contact Zheyuan (Max) Kong (Carnegie Mellon University, Pittsburgh, PA).

Zheyuan (Max) Kong: kongzheyuan@outlook.com | zheyuank@andrew.cmu.edu

