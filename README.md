<h1 align="center">Codex Folding</h1>

<table width="100%">
  <tr>
    <td align="center">
      <table align="center">
        <tr>
          <td align="center">
            <a href="#"><img alt="Version" src="https://img.shields.io/badge/version-v1.1.0-blue.svg" /></a>
            <a href="#"><img alt="VS Code" src="https://img.shields.io/badge/VS%20Code-extension-007ACC.svg" /></a>
            <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-green.svg" /></a>
          </td>
          <td align="right" style="padding-left:12px;"><a href="README-zh.md">中文说明</a></td>
        </tr>
      </table>
    </td>
  </tr>
</table>

✅ **Auto-fold Lengthy Workflows | Customizable Settings | One-Prompt AI Installation**  
✅ **Hide the "Thinking" Noise | Keep Your Chat Clean & Focused | Bilingual (EN/中文)**  
✅ **Designed for Windows | Update-Proof Design**  

Want a clean and easy-to-browse Codex? Tired of Codex's long workflows? It's super simple! Just copy one sentence to Codex to enable folding of Codex's thought process and command execution flow in VS Code.

<table align="center">
  <tr>
    <td width="50%" align="center">
      <img src="Presentation/demo1.png" height="220" alt="Demo 1" />
    </td>
    <td width="50%" align="center">
      <img src="Presentation/demo2.png" height="220" alt="Demo 2" />
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <img src="Presentation/demo3.png" height="220" alt="Demo 3" />
    </td>
    <td width="50%" align="center">
      <img src="Presentation/demo4.png" height="220" alt="Demo 4" />
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <img src="Presentation/demo5.png" height="220" alt="Demo 5" />
    </td>
    <td width="50%" align="center">
      <img src="Presentation/demo6.png" height="220" alt="Demo 6" />
    </td>
  </tr>
</table>

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
