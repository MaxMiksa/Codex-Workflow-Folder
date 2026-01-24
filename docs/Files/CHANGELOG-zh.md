## v0.5.0 – Workflow Folding Patch Release (2026-01-24)

### 功能 1：Workflow 折叠（每轮对话独立）
- **总结**: 为 Codex VS Code 扩展新增“Workflow 折叠”能力，将最终回答之前的所有过程折叠到单独一行。
- **解决痛点**: 原插件在最终回答前会输出很长的思考/工具日志，导致界面冗长、阅读成本高。
- **功能细节**: 
  - 每轮对话插入 `Workflow` 行（位于用户输入与最终回答之间），默认折叠或展开由 `config.toml` 控制。
  - 折叠范围覆盖所有过程项（reasoning、exec、patch、tool-call、plan、错误提示等），展开后保持原始渲染。
  - 标题显示状态与耗时（运行中 1s 刷新），同一轮内保持用户的展开/折叠选择，不跨轮不持久化。
- **技术实现**:
  - 通过脚本 patch 已安装扩展产物：
    - `tools/workflow-fold/patcher.mjs`：对 host/webview/i18n bundle 做幂等字符串注入
    - `tools/workflow-fold/apply.mjs`：自动定位扩展目录、生成 `*.bak` 备份并应用补丁
  - Webview 侧注入点基于既有函数：
    - 包装 `mapStateToLocalConversationItems` 注入 `workflow` item
    - 包装 `LocalConversationItemContent` 渲染 `workflow` 容器并复用原 item 渲染

### 功能 2：三态配置开关（collapse / expand / disable）
- **总结**: 增加 `codex.workflow.collapseByDefault` 三态开关，默认 `disable`。
- **解决痛点**: 用户可自由选择默认折叠/默认展开/完全禁用，不影响原始插件行为。
- **功能细节**:
  - `"collapse"`：显示 Workflow 且默认折叠
  - `"expand"`：显示 Workflow 且默认展开
  - `"disable"` 或缺失：完全不启用该功能（保持原始行为）
- **技术实现**:
  - host 端在 `out/extension.js` 中注入 `<meta name="codex-workflow-collapse" ...>` 给 webview 读取（配置来源为 `C:\Users\<USER>\.codex\config.toml`）。

