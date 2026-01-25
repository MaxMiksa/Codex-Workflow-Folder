# Codex Folding | [English](README.md)

[![版本](https://img.shields.io/badge/版本-v1.0.0-blue.svg)](#)
[![VS%20Code](https://img.shields.io/badge/VS%20Code-扩展-007ACC.svg)](#)
[![许可证](https://img.shields.io/badge/许可证-MIT-green.svg)](LICENSE)

✅ **每轮对话独立 Workflow 折叠 | VS Code 设置三态开关 | 面向 AI 的一键安装/卸载**  
✅ **折叠“思考/工具输出”等过程噪音 | 只保留最终回答干净可读**  
✅ **Windows | Codex VS Code 扩展 `openai.chatgpt`**  

这是一个“补丁式”小插件：把 Codex VS Code 扩展中“最终回答之前的所有过程”折叠进一行 `Workflow`，展开后保持原有展示，不做额外改造。

<table align="center">
  <tr>
    <td>
      <img src="Presentation/demo1.png" height="320" alt="Workflow 折叠演示 1" />
    </td>
    <td>
      <img src="Presentation/demo2.png" height="320" alt="Workflow 折叠演示 2" />
    </td>
  </tr>
</table>

## 功能特性

| 特性（Emoji + 名称） | 说明 |
| :--- | :--- |
| 🧩 Workflow 折叠 | 将每轮对话的所有过程项聚合到独立 `Workflow` 块中。 |
| ⏱️ 实时计时 | 运行中显示 `进行中/完成`，每 1s 刷新耗时。 |
| ⚙️ 配置开关 | VS Code 设置 `codex.workflow.collapseByDefault = "collapse" | "expand" | "disable"`（安装后默认 `"collapse"`）。 |
| 🧯 可回滚 | 自动生成 `*.bak` 备份，且补丁可重复执行（幂等）。 |

## 使用指南（推荐路径）

1. 把下面的“安装 Prompt”发给你的 AI。
2. （可选）在 VS Code 用户设置中设置 `codex.workflow.collapseByDefault` 为 `"collapse" | "expand" | "disable"`。
3. 重启 VS Code。

## 给 AI 的安装/卸载 Prompt

### 安装 Prompt（发给 AI）
```text
严格按照 https://github.com/MaxMiksa/Codex-Folding/blob/main/docs/INSTALL_FOR_AI.md 的步骤安装该功能，不要自由发挥。
```

### 卸载 Prompt（发给 AI）
```text
严格按照 https://github.com/MaxMiksa/Codex-Folding/blob/main/docs/UNINSTALL_FOR_AI.md 的步骤卸载该功能，不要自由发挥。
```

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

- 没生效：重启 VS Code。
- 扩展更新后失效：重新执行 `npm run apply`。
</details>

## 🤝 贡献与联系

欢迎提交 Issue 和 Pull Request！  
如有任何问题或建议，请联系 Zheyuan (Max) Kong (卡内基梅隆大学，宾夕法尼亚州)。

Zheyuan (Max) Kong: kongzheyuan@outlook.com | zheyuank@andrew.cmu.edu
