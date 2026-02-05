<h1 align="center">Codex Workflow Folder</h1>

<p align="center">
  <a href="#"><img alt="Version" src="https://img.shields.io/badge/version-v1.2.0-blue.svg" /></a>
  <a href="#"><img alt="VS Code" src="https://img.shields.io/badge/VS%20Code-extension-007ACC.svg" /></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-green.svg" /></a>
  &nbsp;&nbsp;
  <a href="README-zh.md">中文说明</a>
</p>

✅ **Auto-fold Lengthy Workflows | Customizable Settings | One-Prompt AI Installation**  
✅ **Hide the "Thinking" Noise | Keep Your Chat Clean & Focused | Bilingual (EN/中文)**  
✅ **Cross-Platform (Windows/macOS/Linux) | Version-Track Routing (71+ Track In Progress)**  

Want a clean and **easy-to-browse** Codex? Tired of Codex's **long workflows**?  
It's super simple! Just copy **only one sentence** (see blow) to Codex to enable folding of Codex's thought process and command execution flow in VS Code.

<div align="center">
  <table style="border: none; border-collapse: collapse;">
    <tr>
      <td align="center" style="border: none; vertical-align: middle;">
        <h3>Before</h3>
        <img src="Presentation/before-folding.jpg" width="380" alt="Before: Long workflow" style="border: 1px solid #ccc; border-radius: 8px;" />
      </td>
      <td align="center" style="border: none; vertical-align: middle; font-size: 32px; padding: 0 20px;">➡️</td>
      <td align="center" style="border: none; vertical-align: middle;">
        <h3>After</h3>
        <img src="Presentation/after-folding.png" width="380" alt="After: Clean view" style="border: 1px solid #ccc; border-radius: 8px;" />
      </td>
    </tr>
  </table>
</div>

## Features

| ✨ Core Features | 💡 Benefit |
| :--- | :--- |
| **🧩 Smart Folding** | Automatically tucks away lengthy thought processes into a single line; click to expand. |
| **⏱️ Live Status** | Shows real-time elapsed time (e.g., `⚡ 1m 20s`) so you know exactly how long a task takes. |
| **⚙️ Full Control** | Defaults to collapsed, but fully customizable via VS Code settings (expand/disable). |
| **🧯 Safe & Secure** | Auto-backups original files; supports one-click uninstall/rollback; 100% reversible. |

## 🚀 Quick Start: Install & Usage

### 📥 Install
Copy and paste the following prompt to Codex:

```text
Strictly follow https://github.com/MaxMiksa/Codex-Workflow-Folder/blob/main/docs/INSTALL_FOR_AI.md to install this feature. Do not improvise.
```

> Note: the installer now auto-routes by local extension version (`<=0.4.70` legacy track, `>=0.4.71` dedicated 71+ track placeholder).

> 👉 **Important:** Restart VS Code after the AI finishes the task.

<details>
  <summary><b>Personal Default Configuration (Optional)</b></summary>

You can customize behavior in **VS Code Settings** (`Ctrl+,`) by searching for:
`codex.workflow.collapseByDefault`

- `"collapse"` (Default): Auto-fold workflows.
- `"expand"`: Show workflows expanded by default.
- `"disable"`: Turn off the feature completely.
</details>

### 🗑️ Uninstall
To remove the feature, send this prompt to Codex and restart VS Code:

```text
Strictly follow https://github.com/MaxMiksa/Codex-Workflow-Folder/blob/main/docs/UNINSTALL_FOR_AI.md to uninstall this feature. Do not improvise.
```

## More Info

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
- Stack: Node.js (ESM), JS/Markdown, VS Code extension host + webview bundle patching
</details>

<details>
  <summary>Troubleshooting / Known Issues</summary>

- Restart required: if nothing changes, restart VS Code after install/uninstall.
- Official extension updates: updates can overwrite patched artifacts; re-run the install prompt (or `npm run apply`) after an update.
- Remote environments: Remote-SSH / WSL / Dev Containers may store extensions under server-side paths (e.g. `.vscode-server/extensions`), so the default script may patch the wrong place.
- Node missing: the install script requires `node` available in `PATH`.
- Network blocked: if `raw.githubusercontent.com` is blocked, use the GitHub `.../raw/...` fallback URLs in `docs/INSTALL_FOR_AI.md`.
- Version drift: if the script reports missing anchors, upstream changed; stop and open an issue with your extension version and the reported mismatch.
</details>

## 🤝 Contribution & Contact

Welcome to submit Issues and Pull Requests!
Any questions or suggestions? Please contact Zheyuan (Max) Kong (Carnegie Mellon University, Pittsburgh, PA).

Zheyuan (Max) Kong: kongzheyuan@outlook.com | zheyuank@andrew.cmu.edu
