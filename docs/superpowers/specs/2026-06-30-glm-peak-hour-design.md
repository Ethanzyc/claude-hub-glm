# GLM 高峰期提示 — 设计文档

- 日期：2026-06-30
- 状态：待评审
- 作者：Ethanzhu + Claude

## 背景

GLM（智谱）每日下午 14:00–18:00（北京时间）为计费高峰期，单价上浮。用户在状态栏长时间挂着会话时，容易无意识地在贵时段大量消耗额度。希望在此时段给出可见提示，便于主动错峰。

## 目标

本地时间处于 14:00–18:00 时，在智谱行（zhipu line）追加一个高峰标记 `⚡高峰 14–18`（黄色），其余时间不显示任何高峰相关内容。

## 非目标（YAGNI）

- 不把高峰时段暴露为用户可配置项（先用模块常量集中管理；如需可调后续扩展）。
- 非高峰时段不显示状态、不显示倒计时。
- 不依赖网络或外部数据源，纯本地时间判断。

## 设计

### 1. 时间判断（独立、可测）

新增 `src/utils/peak-hour.ts`，导出：

```ts
export const PEAK_START_HOUR = 14;
export const PEAK_END_HOUR = 18;

export function isPeakHour(now: Date = new Date()): boolean {
  const h = now.getHours();
  return h >= PEAK_START_HOUR && h < PEAK_END_HOUR;
}
```

- 区间为 **[14:00, 18:00)**——左闭右开，18:00 整点准时退出（17:59:59 仍算高峰）。
- 使用系统本地时间（`getHours()`），用户在国内即北京时间，零配置。
- 时段定义为模块顶部常量，集中管理，避免散落硬编码。

### 2. 显示（智谱行内追加）

修改 `src/render/zhipu-line.ts`：在 `parts` 数组末尾、数据新鲜度 `[age]` 标签之前，当处于高峰期时 push 一个 part。

- 文案（i18n）：
  - zh：`⚡高峰 14–18`
  - en：`⚡Peak 14–18`
- 颜色：`colors.warning`（黄），与现有 part 一致使用 ` │ ` 分隔。

渲染示例（高峰期）：

```
智谱: 5h ██░ 25% (1h 30m) │ 本周 ███░ 40% (2d) │ ⚡高峰 14–18 [12s]
```

非高峰期：该 part 不 push，智谱行维持原样。

### 3. 配置开关

新增 `display.showZhipuPeakHour: boolean`，默认 `true`。走与 `showZhipu` 一致的 `config.ts` 三件套：

1. `HudConfig.display` 接口新增字段；
2. `DEFAULT_CONFIG.display` 新增默认值 `true`；
3. `mergeConfig` 新增 `typeof === 'boolean'` 验证。

依赖关系：`showZhipu` 关闭 → 智谱行整体不渲染 → 高峰标记自然不显示。`showZhipuPeakHour` 仅控制高峰标记本身。

### 4. 边界决定：跟随智谱行（方案 A）

智谱行现有守卫 `if (!ctx.zhipuUsage) return null`（`zhipu-line.ts` 第 9 行）：没有智谱用量数据时整行不渲染。

本设计**不改动该守卫**。高峰标记作为智谱行的一部分，当 `ctx.zhipuUsage` 为 `null`（未配置 `GLM_API_KEY` 或无缓存数据）时，整行不显示，高峰标记随之不显示。

理由：高峰是 GLM 计费概念，与智谱用量信息语义同源；保持单行渲染逻辑简单。代价是未配 key 时看不到提醒——可接受，后续若需要"永远可见"再扩展为独立渲染分支。

## 改动清单

1. `src/utils/peak-hour.ts`（新增）— `isPeakHour` + 时段常量。
2. `src/render/zhipu-line.ts` — 高峰时追加 part。
3. `src/config.ts` — `showZhipuPeakHour` 字段 / 默认值 / 验证。
4. `src/i18n/`（en、zh）— 高峰标记文案 key。
5. `tests/peak-hour.test.ts`（新增）— `isPeakHour` 边界单测。
6. `npm run build` — 重新编译 `dist/`。

## 测试策略

**单元测试**（`isPeakHour`，用构造的 `Date` 注入时间）：

| 时刻 | 期望 |
|------|------|
| 13:00 | `false` |
| 13:59:59 | `false` |
| 14:00:00 | `true` |
| 16:00 | `true` |
| 17:59:59 | `true` |
| 18:00:00 | `false` |
| 00:00 / 23:00 | `false` |

**手动验证**：临时改系统时间或在 `zhipu-line` 注入 mock 时间，确认高峰标记按时段出现/消失。

## 风险与备注

- 时间正确性依赖本机时区设置正确（用户在国内 = 北京时间）。
- 状态栏约每 300ms 重新调用一次，时间判断实时准确，跨过 14:00 / 18:00 边界会自动刷新。
- `⚡` 闪电符号在 `visualLength` 中按 emoji 双宽处理，已在现有渲染逻辑覆盖，无需额外适配。
