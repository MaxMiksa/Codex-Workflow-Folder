# Workflow 展开态底部“同款收起行”调研记录（不写代码版）

> 目标：在 Workflow **展开状态**下，在展开内容的最底部增加一个与顶部 `Workflow` heading 行**内容与样式一致**的结尾行按钮，便于用户在长内容滚动到底部时直接点击收起。  
> 约束：折叠状态保持现状（仅顶部 heading）；展开态同时存在顶部 heading + 底部同款结尾行（上下对称、边框不同）。

## 0. 已知现状（来自当前实现）

当前 Workflow UI（我们注入的 `__CodexWorkflowItem`）结构是：

1) 外层容器：`div.border ... overflow-hidden`（负责整体边框与圆角）
2) 顶部 heading：`button.w-full ...`（唯一可点击区域，负责折叠/展开）
3) 展开内容：`div.border-t ...`（仅当展开且 children 非空时渲染）

结论：
- 目前“展开区域整块可点”的问题已经解决（只有 heading 行可点）。
- 新需求本质是：在 (3) 之后增加 (4) **footer button**，让用户不用滚回顶部即可收起。

## 1. 需求澄清（本轮唯一确定点）

- 折叠态：保持现状（只有 heading）
- 展开态：顶部 heading + 展开内容 + 底部同款结尾行（内容与样式一致）
- 边框：上下对称、但边框不同（理解为：header 位于顶部，footer 位于底部；两者都在同一个外层边框容器内，分隔线对称）

## 2. 需要回答的问题（设计前必须想清楚）

1) Footer 行是否显示“同样的计时与状态（⚡/✅ + elapsed）”？  
   - 倾向：是（“内容一致”），避免用户困惑。

2) Footer 行的 chevron 是否与 header 同步（展开时旋转 90°）？  
   - 倾向：是（“样式一致”）。

3) Footer 行与展开内容之间如何做“边框对称”？  
   - 倾向：在 footer 上加 `border-t`，与展开内容顶部的 `border-t` 对应，形成上下对称分隔线。

4) Footer 行是否在 children 为空时显示？  
   - 倾向：不显示（与现有展开区渲染条件一致：无内容无需多一个按钮）。

## 3. 可选方案（只比较可能性）

### 方案 A：在展开内容底部添加一个“Footer Button”（推荐）

- 做法：在 `expanded` 渲染之后，增加一个 `footer` 按钮：
  - 仅当 `expanded` 存在时渲染
  - 内容复用与 header 相同的 `row`
  - footer 增加 `border-t`（分隔线），background 同 header
  - 点击行为与 header 相同：`setCollapsed(v => !v)`（展开态即收起）

优点：
- 实现最直接、与现有结构最一致。
- 不引入额外滚动容器，不改变展开内容的 DOM。
- 保持“只有两个按钮可点”，展开内容本体仍不可点。

风险：
- 需要注意避免“重复的 button 语义”影响可访问性（可用 `type="button"`，并保持相同 aria-label/结构或提供更明确 label）。

### 方案 B：把展开内容做成内部可滚动容器，并把 footer 固定在底部（不推荐）

- 做法：让展开内容在固定高度内滚动，footer 固定可见。

缺点：
- 会改变现有滚动行为与布局高度，影响用户习惯。
- 复杂度更高，且容易与上游布局/高度计算冲突。

### 方案 C：允许点击展开内容空白区域收起（已明确不想回退）

结论：不考虑。

## 4. 本机可得信息（用于评估“能不能做”）

在上游 webview bundle 中，`LocalConversationItemContent(rt)` 的 props 解构包含：
- `conversationId`
- `isMostRecentTurn`
- `expandSignal`
- 以及 `item`

这意味着：
- 我们可以在 footer 行中复用现有 heading 的渲染信息（包括计时持久化相关的 key 计算），不需要额外上下文。

## 5. 推荐方案与落地要点（仍不写代码）

推荐：**方案 A（展开态 footer button）**。

落地要点：
- Footer 与 header 使用同一套 row 内容（Workflow label + meta + chevron），确保“内容与样式一致”。
- Footer 只在展开态渲染，折叠态保持现状。
- Footer 增加 `border-t border-token-border/80`，与顶部展开内容的分隔线形成上下对称。
- Footer 点击仅触发折叠/展开切换，不触发任何计时写入或其它副作用。

## 6. 测试策略草案（先列出，开发后再完善）

单元测试（patcher 层）：
- 断言 webview patch 标记版本升级（新增 `CODEX_WORKFLOW_FOLD_PATCH_V12` 等）
- 断言注入代码包含 footer 相关关键字（例如变量名 `footer` 或 `border-t` 的 footer 按钮片段）
- 保持已有测试：plan items 不被 fold；workflow fold 行为不变

本机 dry-run：
- `npm run verify` 应能在已安装扩展上检测到需要 patch（dry-run 输出 PATCHED/OK）

