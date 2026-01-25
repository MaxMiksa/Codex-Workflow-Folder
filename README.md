# Codex Folding | [中文说明](README-zh.md)

[![Version](https://img.shields.io/badge/version-v0.5.0-blue.svg)](#)
[![VS%20Code](https://img.shields.io/badge/VS%20Code-extension-007ACC.svg)](#)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

✅ **Per-turn Workflow folding | 3-state VS Code setting | One-command install/uninstall for AI**  
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
| ⚙️ Config Switch | VS Code setting `codex.workflow.collapseByDefault = "collapse" | "expand" | "disable"` (default: `"collapse"` after install). |
| 🧯 Safe & Reversible | Creates `*.bak` backups and is idempotent. |

## Usage Guide (Happy Path)

1. Ask your AI to install using the prompt below.
2. (Optional) Set VS Code user setting `codex.workflow.collapseByDefault` to `"collapse" | "expand" | "disable"`.
3. Restart VS Code.

## AI Install/Uninstall Prompts

### Install Prompt (give to AI)
```text
Strictly follow https://github.com/MaxMiksa/Codex-Folding/blob/main/docs/INSTALL_FOR_AI.md to install this feature. Do not improvise.
```

### Uninstall Prompt (give to AI)
```text
Strictly follow https://github.com/MaxMiksa/Codex-Folding/blob/main/docs/UNINSTALL_FOR_AI.md to uninstall this feature. Do not improvise.
```

<details>
  <summary>Requirements & Limits</summary>

- This project patches the installed extension build artifacts (no upstream source build required).
- VS Code must be restarted after install/uninstall.
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

- If nothing changes, restart VS Code.
- If VS Code updates the extension, re-run `npm run apply`.
</details>

## 🤝 Contribution & Contact

Welcome to submit Issues and Pull Requests!
Any questions or suggestions? Please contact Zheyuan (Max) Kong (Carnegie Mellon University, Pittsburgh, PA).

Zheyuan (Max) Kong: kongzheyuan@outlook.com | zheyuank@andrew.cmu.edu
