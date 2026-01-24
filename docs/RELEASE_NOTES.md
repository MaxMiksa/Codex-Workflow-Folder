## v0.5.0 – Workflow Folding / Workflow 折叠 (2026-01-24)

## ✨ Workflow 折叠：把“过程”收起来，只看最终回答

**为 Codex VS Code 扩展新增每轮对话独立的 `Workflow` 折叠行，默认可折叠过程输出，让界面更清爽。**

| 类别 | 详细内容 |
| :--- | :--- |
| **Workflow 折叠** | 将最终回答之前的所有过程（思考/工具调用/输出/状态提示等）折叠到 `Workflow` 中。 |
| **三态开关** | `collapse / expand / disable`，缺省按 `disable` 处理，修改后重启 VS Code 生效。 |
| **可回滚** | 自动创建 `*.bak`，可通过恢复备份一键卸载。 |

## ✨ Workflow Folding: collapse the noisy process stream

**Adds a per-turn `Workflow` folding line to the Codex VS Code extension, keeping the final answer readable while preserving the original rendering when expanded.**

| Category | Details |
| :--- | :--- |
| **Workflow Folding** | Folds all pre-final process items (reasoning/tools/output/status) into `Workflow`. |
| **3-state Switch** | `collapse / expand / disable`, default `disable`, requires VS Code restart after config changes. |
| **Reversible** | Creates `*.bak` backups so uninstall is just restoring originals. |

