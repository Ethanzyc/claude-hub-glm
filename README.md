# Claude Hub GLM

基于 [claude-hud](https://github.com/jarrodwatts/claude-hud) 的 fork，在保留原版所有功能的基础上，新增了**智谱 Coding Plan 用量显示**。

[![License](https://img.shields.io/github/license/Ethanzyc/claude-hub-glm?v=2)](LICENSE)
[![Stars](https://img.shields.io/github/stars/Ethanzyc/claude-hub-glm)](https://github.com/Ethanzyc/claude-hub-glm/stargazers)

> 🌐 中文文档 | [English](README.en.md)

---

## 与原版的区别

在原版 claude-hud 的基础上，新增了智谱（Zhipu）Coding Plan 用量实时显示：

- **5 小时用量** — 显示当前 5 小时窗口内的 Token 用量百分比和重置倒计时
- **周用量** — 显示本周 Token 用量百分比和重置倒计时
- **MCP 用量** — 显示 MCP 调用次数（已用/总量）和重置倒计时
- **订阅信息** — 显示当前套餐名称和续费时间
- **数据缓存** — 本地缓存 API 响应，避免频繁请求（默认 5 分钟刷新）

显示效果示例：
```
智谱: 5h ██░░░░░░░░ 25% (resets in 2h 30m) │ 本周 ████░░░░░░ 40% (resets in 3d) │ MCP ██░░ 3/10 (resets in 1h) │ Coding Plan (renews 2026-06-15) [2m]
```

### 智谱配置项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `display.showZhipu` | boolean | `true` | 是否显示智谱用量行 |
| `display.zhipuCachePath` | string | `""` | 自定义缓存文件路径（默认自动选择） |
| `display.zhipuFreshnessMs` | number | `300000` | 缓存刷新间隔（毫秒），默认 5 分钟 |

### API Key 获取方式

插件会自动检测环境变量来获取智谱 API Key（二选一）：

1. **`GLM_API_KEY`** — 直接设置智谱 API Key
2. **自动检测** — 当 `ANTHROPIC_BASE_URL` 为 `https://open.bigmodel.cn/api/anthropic` 时，自动使用 `ANTHROPIC_AUTH_TOKEN`

---

## 安装

在 Claude Code 中运行以下命令：

**步骤 1：添加市场**
```
/plugin marketplace add Ethanzyc/claude-hub-glm
```

**步骤 2：安装插件**
```
/plugin install claude-hub-glm
```

安装完成后，重新加载插件：

```
/reload-plugins
```

**步骤 3：配置状态栏**
```
/claude-hud:setup
```

完成！重启 Claude Code 即可看到 HUD。

<details>
<summary><strong>⚠️ Linux 用户：请先点击此处</strong></summary>

在 Linux 上，`/tmp` 通常是独立的文件系统（tmpfs），这会导致插件安装失败并报错：
```
EXDEV: cross-device link not permitted
```

**修复方法**：在安装前设置 TMPDIR：
```bash
mkdir -p ~/.cache/tmp && TMPDIR=~/.cache/tmp claude
```

</details>

### 配置 StatusLine

运行 `/claude-hud:setup` 配置状态栏。如果你是手动从源码安装，需要手动将以下内容添加到 `~/.claude/settings.json`：

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash -c 'node /path/to/claude-hub-glm/dist/index.js'"
  }
}
```

将 `/path/to/claude-hub-glm` 替换为实际的仓库路径。

---

## 原版功能

Claude HUD 是一个 Claude Code 插件，实时显示上下文使用率、活跃工具、运行中的 Agent 和待办进度。始终在你的输入下方可见。

| 你看到的内容 | 为什么重要 |
|--------------|------------|
| **项目路径** | 知道你当前在哪个项目中（可配置 1-3 级目录深度） |
| **上下文健康度** | 在上下文窗口满之前准确了解还剩多少 |
| **工具活动** | 实时观察 Claude 读取、编辑和搜索文件 |
| **Agent 追踪** | 查看哪些子 Agent 正在运行以及它们在做什么 |
| **待办进度** | 实时跟踪任务完成情况 |
| **智谱用量** | 实时显示智谱 Coding Plan 的用量和配额 |

### 默认显示（2 行）
```
[Opus] │ my-project git:(main*)
上下文 █████░░░░░ 45% │ 用量 ██░░░░░░░░ 25%（1h 30m / 5h）
```

### 可选行（通过 `/claude-hud:configure` 启用）
```
◐ Edit: auth.ts | ✓ Read ×3 | ✓ Grep ×2        ← 工具活动
◐ explore [haiku]: 查找认证代码（2分15秒）       ← Agent 状态
▸ 修复认证漏洞（2/5）                             ← 待办进度
智谱: 5h ██░░░░░░░░ 25% │ 本周 ████░░░░░░ 40%    ← 智谱用量
```

---

## 配置

随时自定义你的 HUD：

```
/claude-hud:configure
```

### 配置文件位置

编辑 `~/.claude/plugins/claude-hud/config.json`：

```json
{
  "language": "zh",
  "lineLayout": "expanded",
  "pathLevels": 2,
  "display": {
    "showTools": true,
    "showAgents": true,
    "showTodos": true,
    "showZhipu": true
  }
}
```

### 配置示例（完整）

```json
{
  "language": "zh",
  "lineLayout": "expanded",
  "pathLevels": 2,
  "elementOrder": ["project", "tools", "context", "usage", "zhipu", "memory", "environment", "agents", "todos"],
  "gitStatus": {
    "enabled": true,
    "showDirty": true,
    "showAheadBehind": true,
    "showFileStats": true
  },
  "display": {
    "showTools": true,
    "showAgents": true,
    "showTodos": true,
    "showConfigCounts": true,
    "showDuration": true,
    "showMemoryUsage": true,
    "showZhipu": true
  },
  "colors": {
    "context": "cyan",
    "usage": "cyan",
    "warning": "yellow",
    "usageWarning": "magenta",
    "critical": "red",
    "model": "cyan",
    "project": "yellow",
    "git": "magenta",
    "gitBranch": "cyan",
    "label": "dim"
  }
}
```

更多配置项详见 [原版 README](https://github.com/jarrodwatts/claude-hud#configuration)。

---

## 运行环境要求

- Claude Code v1.0.80+
- Node.js 18+ 或 Bun（macOS/Linux）
- Node.js 18+（Windows）

---

## 开发

```bash
git clone https://github.com/Ethanzyc/claude-hub-glm
cd claude-hub-glm
npm ci && npm run build
npm test
```

---

## 致谢

本项目基于 [jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud) 开发，感谢原作者 Jarrod Watts 的出色工作。

---

## 许可证

MIT — 详见 [LICENSE](LICENSE)
