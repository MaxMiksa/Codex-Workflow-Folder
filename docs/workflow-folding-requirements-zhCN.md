# Workflow 折叠需求确认（问答原文归档，zh-CN）

> 本文用于归档“Workflow 折叠”功能的三轮需求澄清问答原文，便于后续实现与验收对齐。
>
> 规格总览见：`PROJECT.md`

> 实现说明（非问答原文的一部分）：由于 `.codex/config.toml` 在实际用户环境中容易造成误判/不稳定，本仓库最终实现改为使用 VS Code 用户设置 `codex.workflow.collapseByDefault` 来控制 `"collapse" | "expand" | "disable"`（安装后默认 `"collapse"`，无需额外配置也能看到效果）。

## Round A（用户提出需求：问题情境描述）

**用户：**
我使用 VS Code 的 Codex 插件。正常工作流程是：我输入需求/问题，Codex 会开始思考、执行、思考、执行…最后给一段文字总结做了什么/回答是什么。

现在的问题是：思考和执行流程通常很长，占用界面篇幅。

希望：在 Codex 的思考和执行流程上方，有一个折叠按钮“workflow”，默认将整个思考和执行流程折叠起来；等用户想看具体流程时，点击 workflow 自动展开原本流程（保持当前界面样式）。

补充信息：
- 产品：Codex VS Code 扩展（Publisher: OpenAI，Extension id: `openai.chatgpt`）
- 版本：`0.4.66`（用户环境 `0.4.66-win32-x64`）
- 平台：Windows（`Microsoft Windows NT 10.0.26200.0 x64`）
- Codex：`0.89.0`

## Round B（初次澄清：范围/默认行为/交互/配置/交付）

**助手：**（问题摘要）
1) 折叠什么：tool calls？中间 reasoning？最终回答之前全部？  
2) workflow 是每条 assistant 消息独立，还是整段会话一个总折叠区？  
3) 默认折叠规则：总是折叠/阈值折叠/失败自动展开/是否记忆状态？  
4) 入口放哪：消息顶部 `Workflow` + chevron？是否考虑键盘/无障碍？一次性展开还是分步展开？  
5) 配置与交付：是否做成可配置开关、范围仅扩展？最终是 fork 分支先可用再独立 repo？

**用户：**
1.1 “思考和执行流程”= 最终回答之前的所有过程。  
1.2 进一步说明：每个 session 有多轮对话；每轮对话由三部分组成（用户输入、Codex 的过程、最终回答）。我希望 workflow 只控制“Codex 的过程”折叠与否；不同轮对话各自独立。  
1.3 希望最终版本实现：
- 每轮对话：用户输入（不改）、workflow（过程折叠）、最终回答（不改）。
- workflow 标题保留信息：`Workflow (Done/Working, 10m32s)`，最好时间实时刷新。

2.1 每次新回复都折叠。  
2.2 仍保持折叠直到用户手动点击 workflow 展开。  
2.3 不需要状态记忆（减轻工作量）。

3.1 入口：消息顶部/header：`Workflow` + chevron（`Workflow >`）。  
3.2 不需要考虑键盘/无障碍支持。  
3.3 一次性全部展开。

4 展开后保持现有展示样式，不做额外改造。

5.1 配置：希望通过 `config.toml` 可配置：  
- `true`：显示 workflow 并默认折叠  
- `false`：显示 workflow 并默认不折叠  
- `disable`：等同未改  
键名：`codex.workflow.collapseByDefault`
5.2 仅针对 Codex 的 VS Code 插件。  
5.3 交付：先在 fork 的 `fold` 分支做出可用版本，然后我会单独开一个独立 repo（不给官方提 PR/Issue）。安装方式希望类似 skill/mcp 的“让 Codex 复刻修改步骤”，用户只需重启 VS Code 即可使用。

## Round C（进一步定稿：边界/计时/状态/配置与容错）

**助手：**（问题摘要）
1) workflow 边界：中间文字、tool 调用/输出、系统状态提示哪些进/出？无过程时还显示吗？  
2) 计时：起点/终点口径、刷新频率。  
3) 状态：Working/Done 之外是否区分 Failed/Canceled/Timeout？失败时计时是否停止？  
4) 折叠细节：Working 中途展开是否实时追加？同一轮内是否保持用户选择？  
5) config 三态表示：是否接受混合类型？路径在哪里？  
6) UI 位置：过程区域在 UI 哪一层，便于插入包裹容器。

**用户：**
1.1 全部进 workflow 折叠部分（中间文字、tool 调用、tool 输出、系统/插件状态提示）。  
1.2 无过程就不显示 workflow（我们能做到这种检测吗？）

2.1 起点：按下发送的时间（三者差别不大，用最容易实现的）。  
2.2 终点：也用最容易实现的。  
2.3 刷新：1s 一次即可。

3.1 如果能拿到状态就显示 `Error/Failed`、`Canceled`、`Timeout`；拿不到就都写 `Done`（或更地道的文案）。  
3.2 不要停止，要一直计时到终点。

4.1 折叠状态：用户只看到输入、workflow、最终输出；展开状态：看到当前版本界面（只是多一行 workflow），其他不改。  
4.2 不跨轮/不持久化，但同一轮内保持用户当前选择。

5.1 希望统一字符串枚举：`"collapse" | "expand" | "disable"`  
5.2 config 路径：`C:\Users\Max\.codex\config.toml`

6 截图说明：该轮对话中需要折叠的“过程”是从 `cd` 到 `HEAD` 的那一段，最终回答保持不变。

## Round D（最后确认：容错/本地化/默认值/稳定性）

**助手：**（问题摘要）
- 无过程检测：是否接受偶尔空 workflow？  
- 状态文案 & 是否随语言本地化？  
- 配置缺失默认值 & 修改 config 后是否允许重启 VS Code 生效？  
- 计时起点是否可用“最稳定事件”（不严格等于按键时刻）？

**用户：**
1. 能接受偶尔的一个空的 workflow。  
2. 文案你决定更合适的；跟随界面语言（Codex 插件本身也读取语言配置，可照抄）。  
3. 默认按 `"disable"` 处理；修改 config 后需要重启 VS Code 才生效可接受。  
4. 可以，怎么容易和稳定怎么来。
