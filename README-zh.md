<h1 align="center">Codex Workflow Folder</h1>

<p align="center">
  <a href="#"><img alt="版本" src="https://img.shields.io/badge/版本-v1.2.0-blue.svg" /></a>
  <a href="#"><img alt="VS Code" src="https://img.shields.io/badge/VS%20Code-扩展-007ACC.svg" /></a>
  <a href="LICENSE"><img alt="许可证" src="https://img.shields.io/badge/许可证-MIT-green.svg" /></a>
  &nbsp;&nbsp;
  <a href="README.md">English</a>
</p>

✅ **自动折叠冗长流程 | 支持个性化配置 | AI 一句指令极速安装**  
✅ **隐藏“思考与工具”噪音 | 让对话界面回归清爽 | 中英双语支持**  
✅ **跨平台（Windows/macOS/Linux） | 版本分轨安装（71+ 轨道开发中）**  

想拥有一个整洁且**便于上下浏览**的codex？厌倦了codex中长长的workflow？  
超级简单！**仅需复制一句话**给codex，你就能够在vscode中手动折叠codex的思考与命令执行流程。

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

## 功能特性

| ✨ 核心特性 | 💡 用户收益 |
| :--- | :--- |
| **🧩 智能折叠** | 自动将冗长的思考过程收纳进一行，点击即可展开查看详情。 |
| **⏱️ 实时状态** | 实时显示运行耗时（如 `⚡ 1m 20s`），任务完成一目了然。 |
| **⚙️ 自由控制** | 默认折叠，但支持通过 VS Code 设置改为默认展开或彻底关闭。 |
| **🧯 安全无忧** | 自动备份原文件，支持一键卸载回滚，安装过程完全可逆。 |

## 🚀 快速开始：安装与使用

### 📥 安装
直接复制以下指令（Prompt）发送给 Codex：

```text
严格按照 https://github.com/MaxMiksa/Codex-Workflow-Folder/blob/main/docs/INSTALL_FOR_AI.md 的步骤安装该功能，不要自由发挥。
```

> 说明：安装脚本现在会按本地扩展版本自动分流（`<=0.4.70` 走 legacy 轨道，`>=0.4.71` 走 71+ 独立轨道占位）。

> 👉 **重要：** AI 执行完毕后，请 **重启 VS Code** 以生效。

<details>
  <summary><b>个性化默认配置（可选）</b></summary>

您可以在 **VS Code 设置** (`Ctrl+,`) 中搜索 `codex.workflow.collapseByDefault` 来调整默认行为：

- `"collapse"` (默认)：自动折叠 Workflow。
- `"expand"`：默认展开 Workflow。
- `"disable"`：彻底关闭此功能。
</details>

### 🗑️ 卸载
如需移除，发送以下指令给 Codex 并重启 VS Code 即可：

```text
严格按照 https://github.com/MaxMiksa/Codex-Workflow-Folder/blob/main/docs/UNINSTALL_FOR_AI.md 的步骤卸载该功能，不要自由发挥。
```

## 其他

<details>
  <summary>环境要求与限制</summary>

- 本项目直接 patch 已安装的扩展产物（不要求拿到上游扩展源码并构建）。
- 安装/卸载后需重启 VS Code 才生效。
</details>

<details>
  <summary>开发者指南</summary>

- 运行测试：`npm test`
- 应用补丁：`npm run apply`
- 验证（不落盘）：`npm run verify`
- 技术栈：Node.js（ESM）、JavaScript/Markdown、VS Code 扩展 host/webview 产物补丁
</details>

<details>
  <summary>排错 / 已知问题</summary>

- 没生效：安装/卸载后需重启 VS Code。
- 扩展更新后失效：官方扩展更新可能覆盖被 patch 的产物；更新后重新执行安装 Prompt（或运行 `npm run apply`）。
- Remote 环境不保证：Remote-SSH / WSL / Dev Containers 可能把扩展放在服务器侧路径（例如 `.vscode-server/extensions`），默认脚本可能 patch 到错误位置。
- 找不到 Node：安装脚本需要 `node` 可在 `PATH` 中被找到。
- 网络受限：如 `raw.githubusercontent.com` 被阻断，请改用 `docs/INSTALL_FOR_AI.md` 中的 GitHub `.../raw/...` 备用链接。
- 版本漂移：如果脚本提示找不到锚点/匹配失败，说明上游扩展结构变更；请停止并提交 Issue，附上扩展版本号与报错信息。
</details>

## 🤝 贡献与联系

欢迎提交 Issue 和 Pull Request！  
如有任何问题或建议，请联系 Zheyuan (Max) Kong (卡内基梅隆大学，宾夕法尼亚州)。

Zheyuan (Max) Kong: kongzheyuan@outlook.com | zheyuank@andrew.cmu.edu
