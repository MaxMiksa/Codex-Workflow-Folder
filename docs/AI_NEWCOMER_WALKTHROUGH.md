# 新人（零上下文）如何“仅凭 INSTALL_FOR_AI.md”复刻安装流程

> 视角设定：我是一个对本项目完全不了解的“用户侧 Codex / AI 操作员”。  
> 我只收到一句话：  
> `Strictly follow https://github.com/MaxMiksa/Codex-Folding/blob/main/docs/INSTALL_FOR_AI.md to install this feature. Do not improvise.`

## 结论：能否完全复刻“我们的修改流程”？

**可以复刻“安装/打补丁流程”（remote-first 的用户侧流程）**：因为 `docs/INSTALL_FOR_AI.md` 已经把步骤、命令、预期行为、失败策略写成确定性流程，并且远程脚本会做锚点校验、打补丁、生成备份、输出结果。

**但不能仅凭这一句话复刻“研发/迭代/发布流程”**：例如如何在仓库里改 patch 逻辑、如何升级补丁版本标记、如何写 changelog/release notes、如何打 tag 并创建 GitHub Release——这些属于维护者流程，不在 `INSTALL_FOR_AI.md` 的范围内。

下面按“新人”真实执行路径，把用户侧的安装过程一步一步写出来。

---

## Step 0：我会先做的事（读取并理解唯一入口）

1. 打开 `INSTALL_FOR_AI.md`：  
   https://github.com/MaxMiksa/Codex-Folding/blob/main/docs/INSTALL_FOR_AI.md
2. 我会明确两个原则（因为提示强调 *Do not improvise*）：
   - **不 clone 仓库**、不自行实现 patch。
   - **只执行文档里给的远程脚本与命令**；如果锚点不兼容或条件不满足，就停下并说明原因。

---

## Step 1：检查前置条件（不做假设）

按文档的 “Preconditions”：

1. Windows + PowerShell
2. 已安装 VS Code
3. 已安装 Codex 扩展（`openai.chatgpt`）
4. 机器上可用 Node.js（PATH 里能找到 `node`）

我会用最小动作确认（不额外“发挥”）：

- `node -v`
- （可选）确认扩展目录存在：`$env:USERPROFILE\.vscode\extensions\openai.chatgpt-*`

如果 Node 不存在、或扩展目录不存在，我会停止并提示用户先完成前置条件。

---

## Step 2：下载远程安装脚本（Pinned、可复现）

我会在 `INSTALL_FOR_AI.md` 的 pinned URL 区域找到两类链接：

- `raw.githubusercontent.com`（首选）
- `github.com/.../raw/...`（备用，处理 raw 域名被屏蔽的网络）

然后严格照抄执行其 PowerShell 命令（保存到临时目录）：

```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/MaxMiksa/Codex-Folding/v1.1.0/docs/remote/codex-folding-install.mjs" -OutFile "$env:TEMP\codex-folding-install.mjs"
```

若 raw 域名不可用，再执行备用命令：

```powershell
Invoke-WebRequest -Uri "https://github.com/MaxMiksa/Codex-Folding/raw/v1.1.0/docs/remote/codex-folding-install.mjs" -OutFile "$env:TEMP\codex-folding-install.mjs"
```

**注意**：新人视角下，我不会改 URL 版本号、不会换脚本名字、不会把脚本复制到别的路径——因为这些都属于“自由发挥”。

---

## Step 3：运行安装脚本（脚本负责“找目录/校验/打补丁/备份”）

严格执行：

```powershell
node "$env:TEMP\codex-folding-install.mjs"
```

根据文档的 “Expected behavior”，我会观察输出里是否包含：

1. 找到的扩展目录（形如 `%USERPROFILE%\.vscode\extensions\openai.chatgpt-*`）
2. 目标文件与结果（应只 patch 约定的 3 个产物文件，并创建 `*.bak` 备份，且备份只创建一次）
3. 关键校验标记（例如当前应出现 `CODEX_WORKFLOW_FOLD_PATCH_V10`）
4. 保存手册到用户友好位置（通常是 Downloads）的提示

如果脚本报错（例如锚点不匹配、文件结构不同），新人 AI 在 *Do not improvise* 约束下应该：

- **停止**继续动作  
- 直接把脚本报错信息与“哪里不兼容”反馈给用户/维护者  
- 建议维护者新增 patch profile 或更新脚本以适配该扩展版本

---

## Step 4：重启 VS Code（让 webview 重新加载产物）

文档明确要求重启 VS Code，我会照做并提醒用户：

- 关闭所有 VS Code 窗口
- 重新打开 VS Code

这是新人最容易忽略的一步，但它是“是否看到效果”的关键。

---

## Step 5：用户侧验收（不需要了解代码，也能判断成功）

新人 AI 会按“用户可见结果”验收：

1. 在 Codex 对话里，**每轮用户输入与最终回答之间出现 `Workflow` 折叠行**
2. 点击 `Workflow` 可展开/折叠
3. 展开后应看到被折叠的过程项（思考、工具执行、输出等），且 UI/间距符合当前版本的设计

如果用户未看到 `Workflow`：

- 我会先确认是否重启 VS Code
- 再检查脚本输出是否真的 patch 成功（是否显示 PATCHED/OK）
- 如果脚本输出显示 patch 成功但 UI 仍不出现，则我会按文档建议进入“版本不匹配策略”（让维护者基于实际扩展产物做新适配）

---

## Step 6（可选）：如何回滚（新人也能安全撤销）

如果用户想撤销，我会按 `UNINSTALL_FOR_AI.md` 执行：

1. 下载 pinned 的 uninstall 脚本到 `$env:TEMP`
2. 运行 `node "$env:TEMP\codex-folding-uninstall.mjs"`
3. 重启 VS Code

回滚依赖 `*.bak`，所以属于“低风险、可逆”的用户侧流程。

---

## 作为“新人 Codex”我会遇到的常见阻塞点（以及文档是否足够）

1. **没有 Node.js**：文档有写 Preconditions；新人会停下并提示安装 Node。
2. **raw 域名被屏蔽**：文档给了备用 URL；新人无需发散。
3. **扩展版本不同导致锚点不兼容**：脚本会报错；新人应停止并反馈（这是“不能完全复刻”的边界之一）。
4. **忘记重启 VS Code**：文档明确写了重启；新人应把它当成必做步骤。

---

## 给维护者的建议（让“只凭一句话”更接近 100% 成功）

如果你希望“新人 Codex”在更多环境下也能稳定成功，`INSTALL_FOR_AI.md` 可以考虑补充（但仍保持简洁）：

- 一个“最小验收清单”（看到 Workflow 行、能展开、能折叠）
- “典型失败输出示例 + 该如何停下并反馈”（强调不要硬 patch）
- 明确写出当前验证标记（例如 `CODEX_WORKFLOW_FOLD_PATCH_V10`）与其意义：用于确认已升级到最新补丁逻辑

这能进一步降低新人在失败时的“误操作概率”，同时不会鼓励自由发挥。

