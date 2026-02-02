# UI Element Snapshots（证据归档）

本目录用于保存“元素级排查截图”（如 DevTools 选中元素、控制台探针、UI渲染前后状态），用于复现与回归对比。

## 目录约定

- 一级：证据类型（当前为 `ui-element-snapshots`）
- 二级：扩展版本（如 `openai.chatgpt-0.4.71`）
- 三级：采集日期（`YYYY-MM-DD`）
- 文件名：`NN_原始截图名`（两位序号，保持会话顺序）

示例：

`ui-element-snapshots/openai.chatgpt-0.4.71/2026-02-06/session-elements-8/01_ScreenShot_2026-02-06_021005_982.png`

## 当前已归档

- `openai.chatgpt-0.4.71/2026-02-06/`
  - `session-elements-8/`：共 8 张（用户最终确认的“元素定位截图”集合，不含后续 3 张结果图）

## 本轮会话（0.4.71，元素定位 8 图）

- 路径：`openai.chatgpt-0.4.71/2026-02-06/session-elements-8/`
- 编号语义：
  - `01` `div.group.flex.w-full...`
  - `02` `div.text-token-text-secondary...`
  - `03` `div.cursor-interaction.group...`
  - `04` `span.text-token-foreground/60`
  - `05` `div.[&>*:first-child]...`
  - `06` `p.text-size-chat...`
  - `07` `div.w-full`
  - `08` 全聊天区域截图（无元素浮层）

## 使用建议

- 新版本或新轮次排查时，新增新的版本目录与日期目录，不覆盖旧证据。
- 若同一天有多轮排查，可继续沿用序号递增，或追加 `session-XX` 子目录。
