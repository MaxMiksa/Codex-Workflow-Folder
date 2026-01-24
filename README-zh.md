# Codex Folding | [English](README.md)

[![版本](https://img.shields.io/badge/版本-v0.5.0-blue.svg)](#)
[![VS%20Code](https://img.shields.io/badge/VS%20Code-扩展-007ACC.svg)](#)
[![许可证](https://img.shields.io/badge/许可证-MIT-green.svg)](LICENSE)

✅ **每轮对话独立 Workflow 折叠 | config.toml 三态开关 | 面向 AI 的一键安装/卸载**  
✅ **折叠“思考/工具输出”等过程噪音 | 只保留最终回答干净可读**  
✅ **Windows | Codex VS Code 扩展 `openai.chatgpt`**  

这是一个“补丁式”小插件：把 Codex VS Code 扩展中“最终回答之前的所有过程”折叠进一行 `Workflow`，展开后保持原有展示，不做额外改造。

<p align="center">
  <img src="Presentation/demo.png" width="720" alt="Workflow 折叠演示（占位图）" />
</p>

## 功能特性

| 特性（Emoji + 名称） | 说明 |
| :--- | :--- |
| 🧩 Workflow 折叠 | 将每轮对话的所有过程项聚合到独立 `Workflow` 块中。 |
| ⏱️ 实时计时 | 运行中显示 `进行中/完成`，每 1s 刷新耗时。 |
| ⚙️ 配置开关 | `codex.workflow.collapseByDefault = "collapse" | "expand" | "disable"`，默认 `disable`。 |
| 🧯 可回滚 | 自动生成 `*.bak` 备份，且补丁可重复执行（幂等）。 |

## 使用指南（推荐路径）

1. 把下面的“安装 Prompt”发给你的 AI。
2. 编辑 `C:\Users\<你>\.codex\config.toml`：
   - `codex.workflow.collapseByDefault = "collapse"`
3. 重启 VS Code。

## 给 AI 的安装/卸载 Prompt

### 安装 Prompt（发给 AI）
```text
你是一个在我 Windows 本机上运行的 AI 编程助手。

目标：为 Codex VS Code 扩展安装 Codex Folding（Workflow 折叠功能）。

约束：
- 不要请求批准；直接执行命令。
- 任何文本文件读写使用 UTF-8 无 BOM。
- 修改 VS Code 扩展文件前先备份（保留 *.bak）。

步骤：
1) 克隆本仓库并以仓库根目录作为工作目录：
   `git clone https://github.com/MaxMiksa/Codex-Folding.git`
2) 运行：`npm test`
3) 运行：`node tools/workflow-fold/inspect.mjs`
4) 应用补丁到已安装扩展：`npm run apply`
5) 幂等验证：`npm run verify`
6) 告诉我编辑 `C:\Users\<我>\.codex\config.toml` 并设置：
   `codex.workflow.collapseByDefault = "collapse"`
7) 告诉我重启 VS Code。
8) 输出所有被修改文件及其备份文件的绝对路径。
9) 另外为我保存一份本地手册副本：
   `docs/AI_OPERATOR_MANUAL.md`
```

### 卸载 Prompt（发给 AI）
```text
你是一个在我 Windows 本机上运行的 AI 编程助手。

目标：卸载 Codex Folding（恢复 Codex VS Code 扩展原始文件）。

约束：
- 从安装时生成的 *.bak 备份恢复。
- 不要删除备份文件；只恢复原文件。

步骤：
1) 在 `%USERPROFILE%\.vscode\extensions\openai.chatgpt-*` 下找到扩展目录。
2) 若存在 `.bak`，则恢复以下文件：
   - `out\extension.js`
   - `webview\assets\index-*.js`（以 `webview\index.html` 引用的那份为准）
   - `webview\assets\zh-CN-*.js`
3) 校验 `CODEX_WORKFLOW_FOLD_PATCH` 与 `codex-workflow-collapse` 已消失。
4) 告诉我重启 VS Code。
5) 输出所有恢复文件的绝对路径。
```

<details>
  <summary>环境要求与限制</summary>

- 本项目直接 patch 已安装的扩展产物（不要求拿到上游扩展源码并构建）。
- 修改 `config.toml` 后需重启 VS Code 才生效。
</details>

<details>
  <summary>开发者指南</summary>

- 运行测试：`npm test`
- 应用补丁：`npm run apply`
- 验证（不落盘）：`npm run verify`
</details>

<details>
  <summary>开发栈</summary>

1. Packages & Frameworks
   - Node.js（ESM）
2. Interfaces & Services
   - VS Code 扩展 host/webview 产物补丁
3. Languages
   - JavaScript, Markdown
</details>

<details>
  <summary>FAQ / 排错</summary>

- 改了 config 没生效：重启 VS Code。
- 扩展更新后失效：重新执行 `npm run apply`。
</details>

## 🤝 贡献与联系

欢迎提交 Issue 和 Pull Request！  
如有任何问题或建议，请联系 Zheyuan (Max) Kong (卡内基梅隆大学，宾夕法尼亚州)。

Zheyuan (Max) Kong: kongzheyuan@outlook.com | zheyuank@andrew.cmu.edu
