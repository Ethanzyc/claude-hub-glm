# Claude Hub GLM

A fork of [claude-hud](https://github.com/jarrodwatts/claude-hud) that adds **Zhipu Coding Plan usage display** on top of all original features.

[![License](https://img.shields.io/github/license/Ethanzyc/claude-hub-glm?v=2)](LICENSE)
[![Stars](https://img.shields.io/github/stars/Ethanzyc/claude-hub-glm)](https://github.com/Ethanzyc/claude-hub-glm/stargazers)

> 🌐 English | [中文文档](README.md)

---

## What's Different

On top of the original claude-hud features, this fork adds real-time Zhipu Coding Plan usage display:

- **5-hour usage** — Token usage percentage and reset countdown for the current 5-hour window
- **Weekly usage** — Token usage percentage and reset countdown for the weekly window
- **MCP usage** — MCP call count (used/total) and reset countdown
- **Subscription info** — Current plan name and renewal time
- **Local caching** — Caches API responses to avoid frequent requests (refreshes every 5 minutes by default)

Example output:
```
Zhipu: 5h ██░░░░░░░░ 25% (resets in 2h 30m) │ Week ████░░░░░░ 40% (resets in 3d) │ MCP ██░░ 3/10 (resets in 1h) │ Coding Plan (renews 2026-06-15) [2m]
```

### Zhipu Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `display.showZhipu` | boolean | `true` | Show Zhipu usage line |
| `display.zhipuCachePath` | string | `""` | Custom cache file path (auto-selected by default) |
| `display.zhipuFreshnessMs` | number | `300000` | Cache refresh interval in ms (default: 5 minutes) |

### API Key Detection

The plugin auto-detects your Zhipu API Key from environment variables (either one works):

1. **`GLM_API_KEY`** — Set your Zhipu API Key directly
2. **Auto-detection** — When `ANTHROPIC_BASE_URL` is `https://open.bigmodel.cn/api/anthropic`, uses `ANTHROPIC_AUTH_TOKEN`

---

## Install

Inside a Claude Code instance, run the following commands:

**Step 1: Add the marketplace**
```
/plugin marketplace add Ethanzyc/claude-hub-glm
```

**Step 2: Install the plugin**
```
/plugin install claude-hub-glm
```

After that, reload plugins:

```
/reload-plugins
```

**Step 3: Configure the statusline**
```
/claude-hud:setup
```

Done! Restart Claude Code to see the HUD.

<details>
<summary><strong>⚠️ Linux users: Click here first</strong></summary>

On Linux, `/tmp` is often a separate filesystem (tmpfs), which causes plugin installation to fail with:
```
EXDEV: cross-device link not permitted
```

**Fix**: Set TMPDIR before installing:
```bash
mkdir -p ~/.cache/tmp && TMPDIR=~/.cache/tmp claude
```

</details>

### Configure StatusLine

Run `/claude-hud:setup` to configure the statusline. If you installed from source, manually add the following to `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash -c 'node /path/to/claude-hub-glm/dist/index.js'"
  }
}
```

Replace `/path/to/claude-hub-glm` with the actual repository path.

---

## Original Features

Claude HUD is a Claude Code plugin that shows what's happening — context usage, active tools, running agents, and todo progress. Always visible below your input.

| What You See | Why It Matters |
|--------------|----------------|
| **Project path** | Know which project you're in (configurable 1-3 directory levels) |
| **Context health** | Know exactly how full your context window is before it's too late |
| **Tool activity** | Watch Claude read, edit, and search files as it happens |
| **Agent tracking** | See which subagents are running and what they're doing |
| **Todo progress** | Track task completion in real-time |
| **Zhipu usage** | Real-time Zhipu Coding Plan usage and quota display |

### Default (2 lines)
```
[Opus] │ my-project git:(main*)
Context █████░░░░░ 45% │ Usage ██░░░░░░░░ 25% (1h 30m / 5h)
```

### Optional lines (enable via `/claude-hud:configure`)
```
◐ Edit: auth.ts | ✓ Read ×3 | ✓ Grep ×2        ← Tools activity
◐ explore [haiku]: Finding auth code (2m 15s)    ← Agent status
▸ Fix authentication bug (2/5)                   ← Todo progress
Zhipu: 5h ██░░░░░░░░ 25% │ Week ████░░░░░░ 40%   ← Zhipu usage
```

---

## Configuration

Customize your HUD anytime:

```
/claude-hud:configure
```

### Config File Location

Edit `~/.claude/plugins/claude-hud/config.json`:

```json
{
  "language": "en",
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

### Example Configuration (Full)

```json
{
  "language": "en",
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

For the full list of configuration options, see the [original README](https://github.com/jarrodwatts/claude-hud#configuration).

---

## Requirements

- Claude Code v1.0.80+
- macOS/Linux: Node.js 18+ or Bun
- Windows: Node.js 18+

---

## Development

```bash
git clone https://github.com/Ethanzyc/claude-hub-glm
cd claude-hub-glm
npm ci && npm run build
npm test
```

---

## Acknowledgements

This project is a fork of [jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud). Many thanks to Jarrod Watts for the excellent original work.

---

## License

MIT — see [LICENSE](LICENSE)
