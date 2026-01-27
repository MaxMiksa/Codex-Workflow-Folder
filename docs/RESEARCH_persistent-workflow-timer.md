# Workflow 计时持久化（每轮 Turn）调研记录（不写代码版）

> 目标：把目前显示在 `Workflow` 标题行里的计时（按“每轮/per user turn”：用户发一次消息 → Codex 给最终答复）做成本地持久化：重启 VS Code / 重新打开旧对话后仍能显示此前耗时。

## 0. 决策与约束（来自本轮沟通）

- 计时口径：**每轮（per user turn）**，就是现在 `Workflow` 标题行里的计时。
- 展示位置：仍然在 `Workflow` 标题行（例如 `⚡ 20 m 06 s` / `✅ 20 分 06 秒`），只是现在重启后会变 `0:00`。
- 回填历史（安装前）：**如果麻烦就不做**；默认“只从安装后开始记”。
- 同步范围：**本机即可**（不要求 Settings Sync 跨设备同步）。
- 结束判定：优先采用当前思路：**根据 workflow 状态/结构变化**（从 running → done，或出现最终答复等信号）。
- 技术路线偏好：**路线 A：扩展侧持久化**（更稳健）。
- 本轮要求：只调研，不改代码（但可以新增调研文档）。

---

## 1. “用时”到底是什么（明确口径）

本需求的“用时”= **每轮 turn 的耗时**：

- 开始：该轮用户消息出现（或该轮 workflow 开始出现）
- 结束：该轮 workflow 判定完成（通常与最终答复出现/turn 状态完成强相关）
- 展示：`Workflow` 标题行里的计时

---

## 2. 技术路线候选（只做可行性评估）

### 路线 A：扩展侧持久化（推荐）

思路：Webview 识别每轮的 key + `{startAt,endAt,duration}` → 发消息给扩展 host → host 写入 VS Code 的持久化存储（本机）。

- 优点：跨重启更稳；更符合“remote-first + 跨版本稳健”诉求。
- 难点：需要**稳定 key**（每轮唯一标识）和**可靠结束判定**。

### 路线 B：Webview 内持久化

思路：写 `localStorage/IndexedDB/vscodeApi.setState()`，重启后读取再渲染。

- 优点：改动集中在 webview patch，成本较低。
- 风险：Webview 重建/存储隔离策略变化时更脆；依然需要稳定 key。

### 路线 C：从日志/时间戳推算（不推荐作为主方案）

思路：不存计时结果，靠日志或事件时间戳回算。

- 风险：格式/可访问性/粒度不稳定，跨版本容易碎。
- 结论：除非确认上游已有稳定时间戳字段并能读取，否则不建议。

---

## 3. 本机调研：我们“能拿到什么”（事实收集）

### 3.1 VS Code Codex 扩展（OpenAI）本地形态

- 当前安装扩展：`C:\Users\Max\.vscode\extensions\openai.chatgpt-0.4.67-win32-x64`
  - `package.json` 显示：`displayName: Codex – OpenAI’s coding agent`，`version: 0.4.67`，`main: ./out/extension.js`
- 扩展注册 webview view provider 时启用了：
  - `retainContextWhenHidden: true`
  - 含义：侧边栏 webview 隐藏时仍尽量保留上下文（对“临时计时不丢”有帮助），但**不等于重启后仍在**。

### 3.2 扩展 host ↔ webview 的消息通道存在且较完善

在 `out/extension.js` 中确认到 webview → host 的 message switch-case，包含这些已存在的消息类型（节选）：

- `fetch` / `fetch-stream`（host 代理网络请求并回传）
- `show-diff`（携带 `conversationId`）
- `show-settings`
- `shared-object-subscribe`
- `shared-object-set`（host 侧执行：`this.sharedObjectRepository.set(key,value)`）

含义：
- 我们**无需重新发明通道**：已经有“向 host 写入 key/value”的现成机制（`shared-object-set`）。
- 需要进一步确认：`sharedObjectRepository` 目前是“仅内存共享”还是“落盘持久化”。若仅内存，则仍需走 VS Code 的 globalState/memento 才能跨重启。

### 3.3 Webview 侧：当前 conversation item 结构的关键发现

通过搜索 webview 主 bundle（`webview/assets/index-*.js`）可见：

- `mapStateToLocalConversationItems(...)` 会把每轮 turn 的状态转换为渲染 items 数组。
- 其中生成的核心 items（至少这两类）**没有明显的 turnId 字段**：
  - `type:"user-message"`：包含 `message / images / attachments / commentCount ...`，未见 `turnId`
  - `type:"assistant-message"`：包含 `content / completed ...`，未见 `turnId`
- 但在其他 item 类型中能看到 `turnId`（例如 `plan-implementation`）——说明上游“某些事件”具备 turnId，但 **并不保证我们用于 Workflow 的关键 item 都带 turnId**。

对持久化的影响：
- 如果我们想把数据严格绑定到“真正的 turnId”，需要进一步确认：
  1) 是否能从 `LocalConversationItemContent(rt)` 的 `rt` props（除 `rt.item` 外）取到 turnId / conversationId；
  2) 或者在上游映射阶段就把 turnId 附加到 items（但这意味着改动更深、更易碎）。

### 3.4 我们当前补丁（本仓库）对“key 的稳定性”的现状

当前 workflow 折叠是我们在 webview 内做的二次映射（见 `tools/workflow-fold/patcher.mjs`）：

- 我们把每轮的 pre-final items 聚合成一个人工的 `type:"workflow"` item。
- **该 workflow item 的 `id` 目前是 `workflow-${turnIndex}`（按用户消息计数）**。

这会带来一个潜在问题：
- `turnIndex` 是 UI 渲染时“数出来的序号”，不是上游的稳定 id。
- 在同一个对话里它通常稳定；但一旦上游插入/重排或“隐藏某些 item”，序号可能变化，从而影响持久化映射。

---

## 4. 对“路线 A：扩展侧持久化”的可落地方向（基于当前调研）

### 4.1 最重要的前提：先确定“稳定 key”

我们需要一个可以跨重启复用的 key，理想形态：

- `key = conversationId + stableTurnId`

但当前调研显示：
- webview items 里至少 `user-message` / `assistant-message` 没直接带 turnId
- 扩展 host 的消息里确实出现过 `conversationId`（如 `show-diff`）

因此短期最现实的候选 key（按稳健性/实现成本排序）：

1) **`conversationId + turnIndex`**（最容易落地，但要接受“序号稳定性”依赖上游结构）
2) **`conversationId + hash(user-message text + attachments summary)`**（更抗重排，但要处理重复文本与隐私/体积）
3) **真正的 `turnId`**（最理想，但需要确认我们能从哪里稳定拿到：rt props / 上游 state / host pipeline）

### 4.2 持久化“落点”候选

基于 host 侧既有能力，持久化落点可能有三种：

1) VS Code 的 globalState/memento（本机、跨重启稳定）——路线 A 的标准答案
2) host 侧已有的 `sharedObjectRepository`（需要确认是否落盘；若仅内存则不行）
3) 写文件到某个目录（不建议；权限/清理/跨平台麻烦）

### 4.3 结束判定（你指定：按 workflow 状态/结构变化）

从我们现有补丁看，当前计时使用：
- `__codexWorkflowItemIsRunning(it)` 或我们注入的 `__codexIsRunning`

要做持久化，需要在“从 running → done”时触发一次写入：
- 写入一次 `doneAt` 或 `durationMs`
- 并确保“再次展开/重渲染不会继续增长”（你之前已经修过）

---

## 5. 下一步调研建议（仍然不写代码的前提下）

为避免后续走弯路，建议下一轮继续补齐两块“关键信息缺口”：

1) **确认 `sharedObjectRepository` 是否持久化**
   - 如果它已落盘：我们可以直接用现成 `shared-object-set` 通道存计时，改动会更小。
   - 如果它不落盘：仍需走 globalState/memento。

2) **确认是否能拿到 `conversationId`/turn 的稳定标识**
   - 在 webview 侧：`LocalConversationItemContent(rt)` 的 `rt` 是否含 conversationId/turnId
   - 在 host 侧：是否在向 webview 推送 turn state 的地方能拿到稳定 id（并可顺手写入 globalState）

---

## 6. 相关的第二个需求（占位，待下一轮再展开）

> 展开状态下“滚动很长时不好收起”，希望在展开区域底部也加一个“同款 Workflow 行”按钮，便于直接收起。

后续会单独开一节对该 UI/交互方案做“先研究后实现”的系统性探索。

---

## 7. 补齐两块“关键信息缺口”（本轮调研结论）

> 本节只记录事实与推导，不涉及任何代码改动。

### 7.1 `sharedObjectRepository` 是否持久化？

结论：**不持久化（内存态）**。

证据（来自本机安装扩展 `openai.chatgpt-0.4.67-win32-x64` 的 `out/extension.js`）：

- host 侧 `sharedObjectRepository` 的实现类为 `Ng`，定义为一个简单的内存 store：
  - `store={}`（对象字典）
  - `get(key)`：从 `store` 读
  - `set(key,value)`：写入 `store`，并 `notifySubscribers(...)`
  - **没有**看到任何 `globalState.update(...)` / 文件写入 / 数据库写入等落盘逻辑

推论：
- 现成的 `shared-object-set` 通道**只能在当前 VS Code 进程生命周期内“共享”**，不能跨重启保存。
- 如果仍想复用该通道做“计时持久化”，就必须在 host 侧额外引入落盘层（例如把某些 key 的 set 同步写入 `globalState`）。

### 7.2 能否拿到 `conversationId`/turn 的稳定标识？

#### (A) Webview 侧：`LocalConversationItemContent(rt)` 的 `rt` 是否含 `conversationId` / `turnId`？

结论：**`conversationId` 能拿到；`turnId` 在 props 解构中未出现**。

证据（来自 webview bundle `webview/assets/index-*.js` 中的函数签名/解构）：

- `function LocalConversationItemContent(rt){ ... const { item, ..., conversationId, ... } = rt; ... }`

这意味着：
- 在我们注入的 `Workflow` 渲染组件（覆盖 `LocalConversationItemContent`）里，理论上可以直接从 `rt.conversationId` 拿到**对话级稳定 id**。

但同时也意味着：
- 仅靠 `LocalConversationItemContent(rt)` 的 props，我们**无法直接拿到“每轮 turn 的稳定 id”**（至少在当前版本的该函数参数结构中没看到）。

#### (B) Host 侧：能否在“向 webview 推送 state”时拿到稳定 id？

已确认的事实：
- host 内部逻辑里确实存在 `conversationId` 概念（例如部分消息/功能参数携带 `conversationId`）。
- 由于 webview props 已包含 `conversationId`，可推断：host 在构建/下发渲染数据时已持有该 id。

仍待确认的关键点（下一轮如果要继续深入）：
- host 在构建每轮 turn 数据时，是否存在稳定的 `turnId`（并能在不破坏上游结构的情况下传到 webview 或用于落盘键）？
- 如果没有稳定 turnId，则推荐的最小可行 key 形态为：
  - `conversationId + turnIndex`（turnIndex = 用户消息计数，与我们当前 workflow 聚合逻辑一致）

