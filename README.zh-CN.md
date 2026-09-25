[English](README.md)

# Naomi Taskboard

> **让对话变成推进力。**
>
> 一个本地优先的工作台：把 Codex 对话转成可追踪的议题、可复核的进度，以及有证据指向的结果。

[![许可证](https://img.shields.io/badge/license-Apache--2.0-2f855a.svg)](LICENSE)
[![本地优先](https://img.shields.io/badge/storage-local--first-276749.svg)](PRIVACY.md)
[![Codex](https://img.shields.io/badge/built_for-Codex-4b5563.svg)](https://openai.com/codex/)

Codex 擅长把事情做出来。Taskboard 负责承接“做完之后”的部分：哪些结果值得继续跟进、当前有哪些工作正在推进、不同工作之间如何关联，以及如何在不把每段聊天都变成永久任务的前提下，随时回到原始对话。

## 它解决什么问题

很多 AI 工作区很容易开始一段对话，却很难管理对话产生的后续工作。Taskboard 增加了一层小而明确的控制面：

```text
Codex 对话
    |
    |  人工选择真正重要的内容
    v
可追踪议题
    |
    |  进度、确认、阻塞
    v
可见项目状态
    |
    |  以证据为基础归纳
    v
结果与血缘
```

这里最重要的是“**明确**”：

- session 是工作证据；
- issue 是你明确承诺管理的议题；
- outcome 是值得长期保留的结果；
- lineage 是结果之间有依据或待确认的关系。

Taskboard 不会因为标题相似、工作目录相同或时间接近，就擅自替你创造项目结构。

## 核心能力

### 一个不吵闹的议题看板

用一组清晰状态跟踪工作：

- 待立项
- 待办
- 处理中
- 等你确认
- 遇到阻碍
- 已完成
- 已取消

仪表盘用于快速判断全局，议题看板用于推进，列表视图用于扫描和集中处理。

### 与 Codex 保持原生关联

议题可以打开或绑定 Codex 对话，并保留 Codex 原生路由。Taskboard 不替代 Codex，而是让对话进入更大的工作系统。

### Codex 会话池

会话池是本机最近 session 的只读索引。你可以：

1. 选择值得关注的 session；
2. 打开原始 session；
3. 让它出现在仪表盘提醒中；
4. 当它确实值得持续推进时，明确提升为议题。

提升时只会写入精简描述和 `codex://threads/<thread-id>` 原始证据指针，不会把完整聊天复制进 Taskboard。

### 结果血缘验证视图

Session Outcome Graph 用于回答这些问题：

- 这个 session 最后产生了什么结果？
- 一个 session 是否可以拆出多张结果卡？
- 哪个结果是另一个工作的续做？
- 哪条关系有明确交接证据，哪条只是候选关系？
- 哪些目标还没有完成？

默认只展示主线。候选关系需要按需展开，避免一上来画成无法阅读的毛线球。

### CLI 与 Codex Skill

同一套 Taskboard API 也可以通过 `naomi-taskctl` 使用。随附的 `manage-naomi-taskboard` Skill 为 Codex 提供一套更稳妥的操作边界：认领、执行、验证、进入待确认，以及在用户明确接受后完成。

### 可选的协作部署

默认模式是本地使用。对于受信任的协作者，可以选择 Cloudflare 部署共享看板；每台设备仍然保留自己的 Codex 和仓库路径映射。

## 快速开始

在本仓库目录中运行：

```bash
npm install
npm run build
npm start
```

打开 [http://127.0.0.1:47823](http://127.0.0.1:47823)。

本地运行数据会放在 `.data/`。该目录已经被 Git 忽略，发布开源版本时绝对不要提交或上传。

如果希望前端实时重载：

```bash
npm run dev
```

## 第一个五分钟

1. 创建或选择一个项目。
2. 创建一个边界清晰、可以判断是否完成的议题。
3. 真正开始做之前，不要提前放到“处理中”。
4. 在 Codex 中打开议题，或绑定已有 Codex 对话。
5. Codex 产出需要你判断的结果后，移动到“等你确认”。
6. 只有结果被接受后，才标记为“已完成”。

对于历史工作，使用会话池：

```text
选择 session -> 查看原始对话 -> 提升为议题
```

“选择 session”与“创建任务”是两个动作，这是设计的一部分。

## 安装 Codex Skill

如果希望 Codex 按照更稳定的任务边界操作 Taskboard，可以安装随附 Skill：

```bash
ln -s /absolute/path/to/naomi-taskboard/skills/manage-naomi-taskboard \
  ~/.codex/skills/manage-naomi-taskboard
```

安装后启动新的 Codex task。Skill 推动的是下面这条流程：

```text
检查 -> 认领 -> 执行 -> 验证 -> 待确认 -> 用户接受 -> 完成
```

它不会把“有人负责”自动当成“已经获准开始”，也不会在没有明确接受信号时擅自把议题标记为完成。

## 使用 `naomi-taskctl`

创建项目：

```bash
npm run naomi-taskctl -- project create \
  --id my-project \
  --name "My project" \
  --workspace-path /absolute/path/to/repository
```

创建议题：

```bash
npm run naomi-taskctl -- issue create \
  --project my-project \
  --title "Implement the next slice" \
  --status todo \
  --priority high \
  --labels product,mvp
```

如果使用 `npm link` 安装 CLI，可以直接在 shell 中使用 `naomi-taskctl`。如果要让 CLI 指向其他本机或受信任局域网服务，可以设置 `CODEX_TASKBOARD_URL`。

## 连接 Codex

### 一条命令启动独立窗口

在 macOS 上，推荐使用：

```bash
CODEX_TASKBOARD_HOST=127.0.0.1 npm run codex
```

它会按需启动本地服务，打开独立 Codex 窗口，注入 Taskboard 入口，并持续监控嵌入面板。已有 Codex 窗口不会被修改。

使用嵌入面板时，请保持启动命令所在进程运行。如果它被终止，浏览器可能出现 `ERR_CONNECTION_REFUSED`，因为本地服务已经停止监听。

### 手动注入

如果你已经使用调试端口启动了 Codex：

```bash
open -n -a /Applications/ChatGPT.app --args \
  --remote-debugging-port=9231 \
  --remote-allow-origins=http://127.0.0.1:9231
```

然后在另一个终端注入：

```bash
CODEX_TASKBOARD_HOST=127.0.0.1 \
npm run codex:inject -- --port 9231 --open
```

注入器会保持驻留。使用完毕后按 `Ctrl-C` 停止。

### 构建桌面应用

进行桌面封装开发：

```bash
npm run app:dev
```

构建本地桌面产物：

```bash
npm run app:build
```

桌面应用会包含本地服务、构建后的面板、CLI 包装器、Skill 和注入资源。公开分发仍然需要相应平台的签名与发布流程，详见：

- [代码签名策略](docs/code-signing-policy.md)
- [Windows 卸载说明](docs/windows-uninstall.md)
- [隐私说明](PRIVACY.md)

## session 的数据模型

Taskboard 不把“自动导入所有聊天”作为默认流程。它使用下面这组分层：

| 层级 | 含义 | 默认行为 |
| --- | --- | --- |
| Session | Codex 原始工作证据 | 只读发现 |
| 关注 | 你希望暂时放在手边的 session | 保存在浏览器本地状态 |
| 议题 | 你明确要管理的工作 | 只有提升后才创建 |
| 结果 | 值得长期记住的产出 | 独立于议题生命周期 |
| 血缘边 | 结果之间的关系 | 明确区分有证据和候选关系 |

这套模型不需要一个很重的聊天记忆系统，也能支持：

- 一个 session 拆出多个结果卡；
- 一个结果为多个父工作提供信息；
- 议题保持简洁，而原始对话保持完整；
- 原始证据始终可以一键打开。

与此同时，它避免了一个很常见的错误：把相似措辞、相同目录或临近时间误判成真实依赖。

## 数据与隐私

Taskboard 是本地优先的：

- 本地看板数据保存在当前设备；
- session 发现读取本地元信息，不会把完整对话复制到看板；
- 会话池在你明确提升前保持只读；
- 云端协作是可选功能；
- 项目不包含广告或维护者侧的使用分析服务。

发布或分享代码前，请确认这些内容没有进入压缩包：

```text
.data/
node_modules/
dist/
.playwright-cli/
*.log
```

共享部署前请完整阅读[隐私说明](PRIVACY.md)。

## 配置

| 变量 | 作用 |
| --- | --- |
| `CODEX_TASKBOARD_HOST` | 服务绑定地址。本机使用 `127.0.0.1`。 |
| `CODEX_TASKBOARD_PORT` | 本地服务端口。 |
| `CODEX_TASKBOARD_DATA_DIR` | 本地看板数据位置。 |
| `CODEX_TASKBOARD_URL` | `naomi-taskctl` 使用的 API 地址。 |

仅本机访问：

```bash
CODEX_TASKBOARD_HOST=127.0.0.1 npm start
```

默认局域网模式没有账户认证。不要把它暴露到不受信任的网络；需要公网访问时，请使用带认证的部署边界，并阅读[云端协作说明](docs/cloud-collaboration.md)。

## 常见问题

### 浏览器显示 `ERR_CONNECTION_REFUSED`

浏览器还在，但本地服务没有监听。重新启动：

```bash
npm start
```

然后重新加载 `http://127.0.0.1:47823`。

### 仪表盘是空的

空仪表盘不一定是错误。看板展示的是议题，不是所有 Codex 对话。请在会话池中选择 session，并在它真正值得跟进时提升为议题。

### 正在运行的 Codex 对话没有出现

请确认：

1. Taskboard 服务正在运行；
2. session 位于本机 Codex session 目录；
3. 仪表盘已刷新；
4. 该 session 没有已经通过某个议题关联。

### 嵌入面板消失

启动器或注入器可能已经停止。保持启动面板的命令继续运行，然后刷新 Codex 窗口。

### 结果血缘没有数据

结果血缘是只读验证面板，需要本地存在结果草案；它不会自动扫描所有 session 并凭空推断关系。宁可暂时为空，也不要生成看起来完整但无法解释的血缘图。

## 项目结构

| 路径 | 用途 |
| --- | --- |
| `web/` | 看板、仪表盘、列表、会话池和结果血缘 |
| `server/` | 本地 HTTP API 与集成 |
| `cli/` | `naomi-taskctl` 命令行工具 |
| `skills/manage-naomi-taskboard/` | Codex 操作边界 |
| `scripts/` | 启动器、注入器、打包与验证 |
| `cloud/` | 可选共享部署 |
| `docs/` | 运维与部署文档 |
| `test/` | 回归与集成测试 |

## 验证

运行完整检查：

```bash
npm run check
```

常用的局部检查：

```bash
npm run typecheck
npm run build:web
node --check server/app.mjs
node --check server/project-summary.mjs
git diff --check
```

## 参与贡献

欢迎小而聚焦的贡献。

提交 Pull Request 前，请尽量做到：

1. 先说明面向用户的问题；
2. 不把本地数据和构建产物带进改动；
3. 行为变化时补充或更新回归测试；
4. 写清楚已经验证什么，以及什么仍未验证；
5. 在系统可能擅自创造项目状态的边界上，保持人工确认。

较大的改动可以先开 issue，并说明：

- 一段话描述问题；
- 能解决问题的最小可观察行为；
- 数据与隐私影响；
- 验收方式。

## 路线图

下面这些是有边界的方向，不是自动承诺：

- 面向大量 session 的“先预览、后导入”流程；
- 提升 session 时选择目标项目；
- 可编辑且保留证据依据的血缘边；
- 在不复制完整对话的情况下提取更丰富的结果卡；
- 签名桌面发行版与更顺滑的首次使用流程。

总原则很简单：让下一个有用状态更容易被看见，但不要让系统假装自己知道证据之外的东西。

## 许可证

Apache-2.0，详见 [LICENSE](LICENSE)。

发布前请检查[开源发布清单](docs/open-source-release.md)。
