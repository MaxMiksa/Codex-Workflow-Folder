# Codex Workflow Fold（V19）在 `openai.chatgpt@0.4.71` 的问题全景与目标全景

> 记录日期：2026-02-09  
> 适用范围：`openai.chatgpt` `0.68 ~ 0.71` 兼容阶段  
> 目的：将“用户现场问题”与“希望实现的目标”完整固化，作为后续迭代与验收依据。

## 1) 背景与现场上下文

1. 用户在 2026-02-09 明确反馈：当天将 Codex VS Code 扩展更新到 `0.4.71`。
2. 当前工作目录为 `PR-Codex...` 开发工作区，且已多轮执行安装/重启验证。
3. 用户提供了 Webview 现场信息：
   - `window.location.href` 为 `vscode-webview://...`（上下文正确）
   - `typeof mapStateToLocalConversationItems === "undefined"`
4. 用户补充了 8 张元素截图（已归档），并指出 `0.4.68` 等旧版本存在的“整段可包裹容器”在 `0.4.71` 中不再明显存在。

## 2) 用户反馈问题全景（按影响排序）

1. **安装看似成功但 UI 不符合预期**
   - 可见补丁 marker（说明注入执行过），但聊天区没有稳定出现 `Workflow` 行（标签/气泡）。

2. **过程项被隐藏但未被 Workflow 承接**
   - 用户观测到“thinking/执行过程消失”，最终只剩“用户气泡 + 最终回答”。
   - 这是最严重问题：信息丢失感强，且不满足“可展开查看过程”的产品目标。

3. **运行态进度显示位置异常**
   - 实时进度内容会挤到第一行（前置文本区域），结束后又只剩最终回答，过程缺少明确容器承接。

4. **调试断点难以命中目标函数**
   - 在 `0.4.71` 中，原先可直接命中的符号（例如旧 mapper 路径）不再稳定可见。
   - 用户在 DevTools 中出现 `Canceled` 噪声错误，干扰排查（但非根因）。

5. **多窗口重启带来“是否生效”的判读噪声**
   - 用户同时开多个 VS Code 窗口，某些窗口可能仍持有旧 webview 生命周期，造成结果不一致。

## 3) 根因链路梳理（技术视角）

1. **主 mapper 钩子断裂（0.71 结构变化）**
   - 旧路径依赖 `mapStateToLocalConversationItems`；在用户现场该符号为 `undefined`。
   - 结果：仅靠 legacy 钩子无法触发 fold 重组。

2. **渲染入口符号变化**
   - 除了数据重组路径变化，渲染函数路径也出现版本差异（`LocalConversationItemContent` / `e7`）。
   - 若只改 mapper 不补渲染兼容，可能出现“有 workflow item 但渲染不出来”。

3. **新流式片段可能不含 `user-message`**
   - 某些 turn 片段先出现 assistant/progress/tool 行，再出现或不出现 user 行。
   - 旧分组算法若强依赖 user 锚点，易发生“分组失败或外溢”。

4. **早期兼容版本的兜底不够安全**
   - 在“mapper 生效但 renderer 未命中”组合下，可能把过程项从主列表移走，却未能生成可见 Workflow 行。
   - 这正对应用户观测到的“过程消失”。

## 4) 已定修复方向（V19 口径）

1. **双路径 mapper 兼容**
   - legacy：`mapStateToLocalConversationItems`
   - fallback：`aet(...)`（或等价后处理路径）

2. **渲染器兼容 fallback**
   - 同时支持 `LocalConversationItemContent` 与 `e7`。

3. **无 `user-message` 兼容分组**
   - 新增 `__codexWorkflowFoldItemsV2MaybeNoUser`，避免因缺少 user 锚点丢失分组。

4. **安全兜底原则**
   - 如果 renderer 钩子无法安装，则回退到原始 mapper 行为（不折叠），确保“宁可不折叠，也不隐藏过程项”。

5. **间距策略**
   - 采用“温和压缩”，不删除 DOM 节点，避免交互副作用。

## 5) 你想实现的东西（目标全景 / 验收口径）

以下目标来自用户多轮明确描述，作为后续实现与回归的唯一验收口径：

1. **每个 turn 的主视图结构清晰**
   - 目标结构：`用户气泡` → `Workflow 行` → `最终回答`。

2. **Workflow 必须承接完整过程信息**
   - 包含：工具调用、thinking/reasoning、执行输出、`worked-for`、错误/状态项、前置 assistant 文本。
   - 最终 assistant 回答保留在 Workflow 外层。

3. **运行态也要可见可解释**
   - 对话进行中时，Workflow 行应可见，过程增量应落入 Workflow 语义范围，不应“漂到第一行且无容器”。

4. **三种模式保持可用**
   - `codex.workflow.collapseByDefault = collapse | expand | disable`。

5. **安全优先，不再出现“过程消失”**
   - 任意兼容失败场景下，保底行为应是“显示原始上游项”，而不是隐藏。

6. **视觉优化只做保守压缩**
   - 可压缩空白间距，但不删节点、不改主交互节点。

## 6) 手工验收清单（针对用户当前环境）

1. 在 `openai.chatgpt@0.4.71` 发起一个会产生工具调用/thinking 的简单任务。
2. 运行中检查：是否出现 Workflow 行并承接过程项。
3. 结束后检查：主视图是否保留“用户 + Workflow + 最终回答”语义。
4. 展开 Workflow 检查：`worked-for`、工具调用、thinking、前置 assistant 是否都在内。
5. 三模式回归：`collapse`、`expand`、`disable` 行为分别正确。
6. 多窗口场景：建议先关闭所有含 Codex 视图的窗口，再仅打开目标窗口复测，减少生命周期缓存噪声。

## 7) 结论

本次核心不是“有没有打补丁”，而是“补丁是否命中 0.4.71 的真实数据路径与渲染路径，并在失败时安全回退”。
本文件将“问题定义”和“目标定义”固定下来，避免后续讨论再次漂移到“仅看 marker”而忽略真实 UI 行为。
