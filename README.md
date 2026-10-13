# dsh-writer-m

DeepSeek Harness 分步写作插件：**小说 / 公众号 / 小红书**，按步骤链生成 → 每步可改 prompt → 可套结构模版 → 产物落盘到可配置目录（并可镜像到 Obsidian 库）。

## 这是什么

一个仓外客户端插件，装进 dsh 后左侧栏底部出现「写作工作台」按钮，点开是全屏工作台。它把长文写作拆成一条**步骤链**：每一步生成草稿，你看过满意再落盘，而不是一次性吐全文——适合本地慢模型跑长文。

## 三种写作类型

| 类型 | 步骤数 | 步骤链 |
| --- | --- | --- |
| 小说 | 7 步 | 作品定位 → 大纲 → 人物描述 → 卷大纲 → 章节大纲 → 章节内容 → 润色 |
| 公众号 | 5 步 | 选题与角度 → 标题与开头 → 结构大纲 → 正文 → 润色与排版 |
| 小红书 | 5 步 | 选题与人群 → 标题 → 正文 → 话题标签 → 去AI化 |

各步产物落盘为独立文件（小说：`steps/NN-xxx.md` 与 `chapters/第NNN章.md` 一章一文件），断点靠磁盘重建——「有文件才算做过」。

## 特性

- **每步 prompt 可见、可改、可还原**：点「提示词」面板直接改当前步骤，只对这一步生效；还原即回内置版。
- **本步实际注入预览**：生成前先看「本步实际注入」，确认 {{style}} / {{vault}} 等占位符渲染结果，避免盲跑。
- **风格画像（七维）**：可采样/手写文风画像（视角/节奏/对话/描写/调性/章节奏/爽点节拍），按步骤注入；支持本地 + Obsidian 库双来源（vault 优先）。
- **结构模版**：从样例提炼「骨架 + 硬约束」，只模仿结构，不复制措辞与专有名词。
- **自动续写**：同一份 system 下按目标字数续写（写够才停），带断点结尾 + 任务回执，长章不断头；本地小模型「自己收尾但没写够」也会被接续补齐。
- **多候选/分段生成**：作品定位逐候选、人物描述分段、章节大纲按「预计章数」补写。
- **番茄上架信息**：定位步顺带产出阅读标签/内容标签/作品简介；提供「只补写上架信息」入口。
- **番茄发布**：可拉起真实浏览器走登录态 + 签名发布（默认关闭，需配置登录态目录）。
- **路径越界拦截**：所有落盘路径过 `resolveInside`，拒绝 `../` 越界。
- **Obsidian 双库**：提示词/风格画像在 vault 里是可编辑库（vault 优先），作品/模版是单向镜像。

## 配置项

| 项 | 默认值 | 说明 |
| --- | --- | --- |
| `root` | `~/Documents/dsh-writer-m` | 落盘根目录，所有作品目录都在它之内 |
| `provider` / `model` | 空 | 留空用 dsh 当前默认模型；填了则两字段都要填（model 是模型 id，不是 provider 名） |
| `maxTokens` | `4500` | 单次最大输出 token |
| `vaultPath` | 空 | Obsidian 库根目录；留空自动探测 |
| `enabled` | `true` | 关掉后 API 一律 503 |
| `publish*` | 空 | 番茄发布相关（publishPython / publishScript / publishProfile / publishBookName / publishLoginScript） |

## 番茄发布（可选）

默认关闭。要做真正发布需先在配置里填 `publishProfile`（Playwright 持久化登录态目录）、`publishPython`（可选）等，并先跑登录态脚本建立后台登录态。发布会拉起真实浏览器走 msToken + a_bogus 签名，**请在确认配置无误后再触发**。

## 目录约定

```
<root>/                         落盘根目录（可配置）
  .dsh-writer-m/                状态：用户模版 + 改过的 prompt + 风格画像
  <作品名>/project.json         作品元数据与步骤状态
  <作品名>/steps/NN-xxx.md      各步产物
  <作品名>/chapters/第NNN章.md  章节正文（一章一文件）
<vault>/dsh-writer-m/           Obsidian 库镜像（可选）
  提示词/<genre>-<step>.md      可编辑库（vault 优先）
  风格画像/<id>.md               可编辑库（vault 优先）
```

## 开发

```powershell
node scripts/build-client.mjs   # 把 src-client/ 片段拼成 lib/client.js
node scripts/check-client.mjs   # 客户端契约自检
node scripts/check-host.mjs     # 宿主半区离线自检
```

- 客户端代码在 `src-client/` 下（00-head / 10-base / 20-workbench / 30-tabs / 40-entry），改完重新 build；`lib/client.js` 是构建产物，**不要手改**。
- 宿主半区在 `lib/`（`index.js` + `core/*`），改动后需重启 dsh 生效。

## License

MIT
