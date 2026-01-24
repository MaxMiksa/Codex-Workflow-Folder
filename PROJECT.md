# PROJECT（项目手册）

## 1. 项目目标
为 Codex VS Code 扩展新增一个“Workflow 折叠”能力：
- 每轮对话中，将“最终回答之前的所有过程”聚合到一个可折叠区域 `Workflow >`。
- 默认折叠；用户点击后展开显示原有过程内容；不改变原本内容的呈现方式。
- 折叠标题展示状态与耗时（优先支持实时计时刷新）。
- 通过 `config.toml` 配置开关控制启用/默认折叠行为。

## 2. 环境与版本（已知）
- 产品：Codex VS Code 扩展（Publisher: OpenAI，Extension id: `openai.chatgpt`）
- VS Code 扩展版本：`0.4.66`（用户环境 `0.4.66-win32-x64`）
- 平台：Windows（`Microsoft Windows NT 10.0.26200.0 x64`）
- Codex：`0.89.0`

## 3. 仓库与目录约定
- 本 repo：`d:\Max\Projects\Dev\PR-Codex-Feature-Fold`
- `clone/`：用于存放克隆的 fork 仓库内容
  - 目标仓库：`https://github.com/MaxMiksa/codex.git`
  - 本地路径：`clone/codex`
  - 工作分支：`fold`

## 4. 需求摘要（当前已定）
- 每轮对话独立拥有 workflow 折叠区，状态互不影响。
- 默认折叠；不做“记忆展开”（不跨轮/不持久化），但同一轮内保持用户展开/折叠选择。
- UI 仅新增一个 `Workflow >` 折叠入口与标题信息（状态 + 耗时，1s 刷新）。
- 展开后内容保持原有展示，不做额外重构。
- 折叠范围：最终回答之前的所有过程内容全部进入 workflow（中间文字、tool 调用、tool 输出、系统状态提示）。
- 无过程时：不显示 workflow（如可可靠检测）。
- 配置：`codex.workflow.collapseByDefault = "collapse" | "expand" | "disable"`（位于 `C:\Users\Max\.codex\config.toml`）。

## 5. 需求确认（可实现/可验收）

> 完整问答原文归档见：`docs/workflow-folding-requirements-zhCN.md`

### 5.1 信息架构（每轮对话 3 段）
每轮对话在 UI 中由三部分组成：
1) 用户输入（现状保持不变）
2) **Workflow（新增）**：代表“最终回答之前的所有过程”
3) 最终回答（现状保持不变）

### 5.2 Workflow 折叠范围（必须全部包含）
Workflow 内包含“最终回答之前的所有过程内容”，包括但不限于：
- 模型的中间文字（如 reasoning/analysis 等）
- tool 调用记录（命令/参数）
- tool 输出（stdout/stderr、diff、日志等）
- 系统/插件生成的状态提示（例如 Running、Correcting syntax、Updating plan statuses 等）

### 5.3 无过程时的显示规则
- **目标行为**：如果该轮对话没有任何“过程内容”，则 **不显示** `Workflow` 行。
- **容错**：允许少数边缘情况出现“空 Workflow”（默认折叠，不影响最终回答）。

### 5.4 默认行为与交互
- 默认：每次新回复都默认折叠（遵循配置，见 5.7）。
- 不持久化：不跨轮、不跨重启保存折叠状态。
- 同一轮内：用户手动展开后保持展开；手动折叠后保持折叠。
- 展开方式：一次性全部展开；展开后过程内容继续实时追加展示（等同当前 UI 行为，只是被 workflow 包裹）。

### 5.5 入口样式与内容呈现
- 位置：消息顶部/header 处，显示 `Workflow >`（含 chevron）。
- 展开后：保持原插件的过程展示样式与布局，不做重构或视觉改造；仅新增折叠容器与标题行。

### 5.6 状态与计时
- 标题文本示例：`Workflow (Done/Working, 10m32s)`（最终文案/本地化由实现选择）。
- 计时：
  - 起点：使用“最容易且稳定”的起点（允许用扩展侧可可靠获得的起点事件近似“按下发送”）。
  - 终点：使用“最容易实现且与最终输出对齐”的终点口径。
  - 刷新频率：1s。
  - 不中断：即使失败/取消等场景，也持续计时直到终点口径满足。
- 状态：
  - 若可从现有事件/状态机拿到：优先显示 `Error/Failed` / `Canceled` / `Timeout` 等。
  - 否则退化为：统一显示 `Done`（或等价文案）。

### 5.7 配置（config.toml 三态）
- 文件路径（用户环境）：`C:\Users\Max\.codex\config.toml`
- 键：`codex.workflow.collapseByDefault`
- 取值（字符串枚举）：
  - `"collapse"`：显示 workflow，且默认折叠
  - `"expand"`：显示 workflow，且默认展开
  - `"disable"`：禁用该功能（等同未修改插件）
- 默认值：当键缺失时按 `"disable"` 处理。
- 生效方式：修改 config 后重启 VS Code 才生效（可接受）。

## 6. 进度
- 2026-01-24：完成 fork 仓库克隆到 `clone/codex`，并初始化本 repo 文档三件套。

## 7. 实现与交付（当前落地方式：补丁脚本）

### 7.1 现状说明
- `clone/codex`（openai/codex）本身不包含 VS Code 扩展的源码（至少在当前分支/目录结构下未找到可直接构建的扩展工程）。
- 因此当前先采用“直接 patch 已安装扩展产物”的方式，实现并验证 `Workflow` 折叠能力。

### 7.2 补丁脚本
- 补丁逻辑（纯字符串、可测试、幂等）：`tools/workflow-fold/patcher.mjs`
- 单元测试（TDD）：`tools/workflow-fold/patcher.test.mjs`
- 一键应用到本机已安装扩展（自动备份 `*.bak`）：`tools/workflow-fold/apply.mjs`

常用命令：
- 运行测试：`node --test tools/workflow-fold/patcher.test.mjs`
- 应用并校验：`node tools/workflow-fold/apply.mjs --verify`
- 幂等检查（不落盘）：`node tools/workflow-fold/apply.mjs --dry-run --verify`

### 7.3 当前 patch 的目标文件（用户环境）
- 扩展 host 端：`%USERPROFILE%\\.vscode\\extensions\\openai.chatgpt-0.4.66-win32-x64\\out\\extension.js`
- Webview bundle：`%USERPROFILE%\\.vscode\\extensions\\openai.chatgpt-0.4.66-win32-x64\\webview\\assets\\index-*.js`
- zh-CN 词条：`%USERPROFILE%\\.vscode\\extensions\\openai.chatgpt-0.4.66-win32-x64\\webview\\assets\\zh-CN-*.js`

### 7.4 配置开关（与需求一致）
- `C:\\Users\\Max\\.codex\\config.toml`
- `codex.workflow.collapseByDefault = "collapse" | "expand" | "disable"`
- 默认：缺失时按 `"disable"` 处理；修改后需重启 VS Code 生效。

### 7.5 实现计划文档
- 实现计划（含 TDD/脚本化交付）：`docs/plans/2026-01-24-workflow-fold-implementation-plan.md`

## 8. 发布信息（release-ai）

- 当前版本：`v0.5.0`
- 远程仓库：`https://github.com/MaxMiksa/Codex-Folding`
- Release 页面：`https://github.com/MaxMiksa/Codex-Folding/releases/tag/v0.5.0`
- 变更记录与发布说明（对外可追踪版本）：
  - `docs/Files/CHANGELOG-zh.md`
  - `docs/Files/CHANGELOG.md`
  - `docs/Files/RELEASE_NOTES.md`
- 给 AI 的安装/卸载操作指引：
  - `docs/INSTALL_FOR_AI.md`
  - `docs/UNINSTALL_FOR_AI.md`
