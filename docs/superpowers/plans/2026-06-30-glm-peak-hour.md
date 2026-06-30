# GLM 高峰期提示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 本地时间 14:00–18:00 期间，在智谱行末尾追加 `⚡高峰 14–18`（黄色）标记，其余时间不显示。

**Architecture:** 新增纯函数 `isPeakHour(now)`（注入 `Date`，稳定可测）放 `src/utils/peak-hour.ts`；在 `RenderContext` 上加可选 `now?: Date` 字段（沿用项目 `deps.now` 注入惯例），让 `renderZhipuLine` 的时间来源可在测试中控制，避免随真实时刻 flaky；高峰标记作为智谱行的一个 `part`，复用现有 `warning()` 着色与 ` │ ` 分隔。

**Tech Stack:** TypeScript 5（ES2022 / NodeNext）、Node.js 18+、Node 内置 `node --test`（测试文件为 `tests/*.test.js`，import 编译产物 `dist/`）。

**当前分支：** `feat/glm-peak-hour`（spec 已提交于 `0079b9d`）。

---

## File Structure

| 文件 | 职责 | 动作 |
|------|------|------|
| `src/utils/peak-hour.ts` | 时段常量 + `isPeakHour(now)` 纯函数 | 新建 |
| `tests/peak-hour.test.js` | `isPeakHour` 边界单测 | 新建 |
| `src/i18n/types.ts` | 声明新 `MessageKey` | 改 |
| `src/i18n/en.ts` / `zh.ts` | 高峰文案 | 改 |
| `tests/i18n.test.js` | 文案断言 | 改（追加 test） |
| `src/config.ts` | `showZhipuPeakHour` 字段/默认/验证 | 改 |
| `tests/config.test.js` | 开关断言 | 改（追加 test） |
| `src/types.ts` | `RenderContext.now?` 字段 | 改 |
| `src/index.ts` | 构造 ctx 时赋值 `now` | 改 |
| `src/render/zhipu-line.ts` | 追加高峰 part，统一时间源 | 改 |
| `tests/zhipu-line.test.js` | 高峰/非高峰两分支渲染断言 | 新建 |

**测试约定：** 所有测试 import `../dist/...`，`npm test` = `npm run build && node --test`（先编译再跑全部 `tests/*.test.js`）。因此每个任务的"跑测试"都自动含一次 build。

---

## Task 1: `isPeakHour` 纯函数（TDD）

**Files:**
- Create: `src/utils/peak-hour.ts`
- Test: `tests/peak-hour.test.js`

- [ ] **Step 1: 写失败测试**

创建 `tests/peak-hour.test.js`：

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPeakHour, PEAK_START_HOUR, PEAK_END_HOUR } from '../dist/utils/peak-hour.js';

// 固定到 2026-06-30（避免日期漂移；月份 0-indexed，5 = 6 月）
const at = (hour, minute = 0, second = 0) => new Date(2026, 5, 30, hour, minute, second);

test('exports peak hour constants', () => {
  assert.equal(PEAK_START_HOUR, 14);
  assert.equal(PEAK_END_HOUR, 18);
});

test('returns false before peak start', () => {
  assert.equal(isPeakHour(at(13)), false);
  assert.equal(isPeakHour(at(13, 59, 59)), false);
});

test('returns true at peak start boundary [14:00, 18:00)', () => {
  assert.equal(isPeakHour(at(14, 0, 0)), true);
});

test('returns true during peak', () => {
  assert.equal(isPeakHour(at(16)), true);
  assert.equal(isPeakHour(at(17, 30)), true);
});

test('returns true up to but not including 18:00', () => {
  assert.equal(isPeakHour(at(17, 59, 59)), true);
  assert.equal(isPeakHour(at(18, 0, 0)), false);
});

test('returns false well outside peak', () => {
  assert.equal(isPeakHour(at(0)), false);
  assert.equal(isPeakHour(at(23, 59, 59)), false);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test 2>&1 | grep -A3 peak-hour`
Expected: FAIL，错误为 `Cannot find package .../dist/utils/peak-hour.js`（模块尚未实现）。

- [ ] **Step 3: 写最小实现**

创建 `src/utils/peak-hour.ts`：

```ts
/** GLM（智谱）计费高峰时段，按本地时间小时计。左闭右开 [start, end)。 */
export const PEAK_START_HOUR = 14;
export const PEAK_END_HOUR = 18;

/** 判断给定时刻是否处于高峰时段。默认取当前本地时间。 */
export function isPeakHour(now: Date = new Date()): boolean {
  const hour = now.getHours();
  return hour >= PEAK_START_HOUR && hour < PEAK_END_HOUR;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test 2>&1 | grep -A3 peak-hour`
Expected: 全部 6 个 `peak-hour` 测试 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/utils/peak-hour.ts tests/peak-hour.test.js
git commit -m "feat: add GLM peak-hour detection helper

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: i18n 高峰文案（TDD）

**Files:**
- Modify: `src/i18n/types.ts`、`src/i18n/en.ts`、`src/i18n/zh.ts`
- Test: `tests/i18n.test.js`

- [ ] **Step 1: 写失败测试**

在 `tests/i18n.test.js` 末尾追加：

```js
test("t() returns localized peak hour label", () => {
  setLanguage("zh");
  assert.equal(t("label.peakHour"), "高峰");
  setLanguage("en");
  assert.equal(t("label.peakHour"), "Peak");
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test 2>&1 | grep -A3 "peak hour label"`
Expected: FAIL，`t("label.peakHour")` 回退返回 key 本身 `"label.peakHour"`，不等于 `"高峰"`。

- [ ] **Step 3: 加 key 到三处**

`src/i18n/types.ts` — 在 `// Zhipu` 区块内追加一行（紧跟 `"format.renews"` 之后）：

```ts
  | "label.peakHour"
```

`src/i18n/zh.ts` — 在 Zhipu 区块 `"format.renews": "续费",` 之后追加：

```ts
  "label.peakHour": "高峰",
```

`src/i18n/en.ts` — 在 Zhipu 区块 `"format.renews": "renews",` 之后追加：

```ts
  "label.peakHour": "Peak",
```

> 三处 key 必须一致，否则 `Messages = Record<MessageKey, string>` 类型校验会编译失败。

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test 2>&1 | grep -A3 "peak hour label"`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/i18n/types.ts src/i18n/en.ts src/i18n/zh.ts tests/i18n.test.js
git commit -m "feat(i18n): add peak hour label

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: 配置开关 `showZhipuPeakHour`（TDD）

**Files:**
- Modify: `src/config.ts`
- Test: `tests/config.test.js`

- [ ] **Step 1: 写失败测试**

在 `tests/config.test.js` 末尾追加：

```js
test('showZhipuPeakHour defaults to true and honors user override', () => {
  const def = mergeConfig({});
  assert.equal(def.display.showZhipuPeakHour, true, 'default should be true');

  const off = mergeConfig({ display: { showZhipuPeakHour: false } });
  assert.equal(off.display.showZhipuPeakHour, false, 'user false must be honored');

  const invalid = mergeConfig({ display: { showZhipuPeakHour: 'nope' } });
  assert.equal(invalid.display.showZhipuPeakHour, true, 'invalid value falls back to default true');
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test 2>&1 | grep -A3 showZhipuPeakHour`
Expected: FAIL，`def.display.showZhipuPeakHour` 为 `undefined`，不等于 `true`。

- [ ] **Step 3: 改 `src/config.ts` 三处**

(a) 接口 `HudConfig["display"]`（在 `showZhipu: boolean;` 上一行或紧邻 `zhipuFreshnessMs` 处）加字段：

```ts
    showZhipuPeakHour: boolean;
```

(b) `DEFAULT_CONFIG.display`（紧邻 `showZhipu: true,`）加默认值：

```ts
    showZhipuPeakHour: true,
```

(c) `mergeConfig` 的 `display` 对象（紧邻现有 `showZhipu:` 验证块）加：

```ts
    showZhipuPeakHour: typeof migrated.display?.showZhipuPeakHour === 'boolean'
      ? migrated.display.showZhipuPeakHour
      : DEFAULT_CONFIG.display.showZhipuPeakHour,
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test 2>&1 | grep -A3 showZhipuPeakHour`
Expected: PASS（3 条断言全过）。

- [ ] **Step 5: 提交**

```bash
git add src/config.ts tests/config.test.js
git commit -m "feat(config): add showZhipuPeakHour toggle

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: `RenderContext.now` 注入（可测性基础设施）

> 目的：让 `renderZhipuLine` 的时间来源可注入，高峰分支测试才能稳定。本任务无用户可见行为，验证标准是"编译通过 + 全量测试不回归"。

**Files:**
- Modify: `src/types.ts`（`RenderContext`）、`src/index.ts`（构造 ctx）

- [ ] **Step 1: 给 `RenderContext` 加可选字段**

`src/types.ts` 的 `RenderContext` 接口末尾（`zhipuUsage: ZhipuUsageCache | null;` 之后）加：

```ts
  /** 渲染时的基准时间，便于测试注入；生产由入口注入当前时间。 */
  now?: Date;
```

- [ ] **Step 2: 入口构造 ctx 时赋值**

`src/index.ts` 的 `ctx: RenderContext` 对象字面量（`zhipuUsage,` 之后）加一行：

```ts
      now: new Date(deps.now()),
```

- [ ] **Step 3: 编译并跑全量测试，确认无回归**

Run: `npm test 2>&1 | tail -20`
Expected: build 成功；全部既有测试仍 PASS（新增可选字段不破坏现有 ctx）。

- [ ] **Step 4: 提交**

```bash
git add src/types.ts src/index.ts
git commit -m "refactor: inject now into RenderContext for testable time logic

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: 智谱行追加高峰标记（TDD）

**Files:**
- Modify: `src/render/zhipu-line.ts`
- Test: `tests/zhipu-line.test.js`（新建）

- [ ] **Step 1: 写失败测试**

创建 `tests/zhipu-line.test.js`：

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderZhipuLine } from '../dist/render/zhipu-line.js';
import { setLanguage } from '../dist/i18n/index.js';

function stripAnsi(s) {
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

function makeCtx(now) {
  return {
    config: {
      display: { showZhipu: true, showZhipuPeakHour: true, timeFormat: 'relative' },
      colors: { warning: 'yellow', label: 'dim' },
    },
    zhipuUsage: {
      updatedAt: now.getTime(),
      fiveHour: { percent: 25, resetsAt: null },
      weekly: { percent: 40, resetsAt: null },
      mcp: { used: 0, total: 0, percent: 0, resetsAt: null },
      subscription: null,
    },
    now,
  };
}

test('shows peak badge during 14-18', () => {
  setLanguage('zh');
  const line = stripAnsi(renderZhipuLine(makeCtx(new Date(2026, 5, 30, 15, 0, 0))) ?? '');
  assert.ok(line.includes('高峰'), `expected 高峰 in ${line}`);
  assert.ok(line.includes('14–18'), `expected 14–18 in ${line}`);
});

test('hides peak badge outside 14-18', () => {
  setLanguage('zh');
  const line = stripAnsi(renderZhipuLine(makeCtx(new Date(2026, 5, 30, 12, 0, 0))) ?? '');
  assert.ok(!line.includes('高峰'), `unexpected 高峰 in ${line}`);
  assert.ok(!line.includes('14–18'), `unexpected 14–18 in ${line}`);
});

test('respects showZhipuPeakHour=false even during peak', () => {
  setLanguage('zh');
  const ctx = makeCtx(new Date(2026, 5, 30, 15, 0, 0));
  ctx.config.display.showZhipuPeakHour = false;
  const line = stripAnsi(renderZhipuLine(ctx) ?? '');
  assert.ok(!line.includes('高峰'), `unexpected 高峰 when disabled: ${line}`);
});

test('renders English Peak label', () => {
  setLanguage('en');
  const line = stripAnsi(renderZhipuLine(makeCtx(new Date(2026, 5, 30, 16, 0, 0))) ?? '');
  assert.ok(line.includes('Peak'), `expected Peak in ${line}`);
  assert.ok(line.includes('14–18'), `expected 14–18 in ${line}`);
  setLanguage('en');
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test 2>&1 | grep -A3 "peak badge"`
Expected: FAIL，输出不含 `高峰`（功能未实现）。

- [ ] **Step 3: 改 `src/render/zhipu-line.ts`**

(a) 顶部 import 行（原第 1–5 行区域）改为：

```ts
import type { RenderContext } from '../types.js';
import { label, getQuotaColor, quotaBar, warning, RESET } from './colors.js';
import { getAdaptiveBarWidth } from '../utils/terminal.js';
import { isPeakHour, PEAK_START_HOUR, PEAK_END_HOUR } from '../utils/peak-hour.js';
import { t } from '../i18n/index.js';
import { formatResetTime } from './format-reset-time.js';
```

(b) `renderZhipuLine` 函数体开头（`const timeFormat = ...` 之后、`const parts: string[] = [];` 之前）插入统一时间源：

```ts
  const now = ctx.now ?? new Date();
```

(c) 在 `// Data freshness` 区块**之前**（即 subscription part 之后）插入高峰 part：

```ts
  // GLM peak-hour badge (only during 14:00–18:00 local)
  if (ctx.config.display.showZhipuPeakHour !== false && isPeakHour(now)) {
    const peakText = `⚡${t('label.peakHour')} ${PEAK_START_HOUR}–${PEAK_END_HOUR}`;
    parts.push(warning(peakText, colors));
  }
```

(d) 把 age 计算里的 `Date.now()` 改为 `now.getTime()`（统一时间源，原第 61 行）：

```ts
  const ageMs = now.getTime() - ctx.zhipuUsage.updatedAt;
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test 2>&1 | grep -A3 "peak badge\|Peak label"`
Expected: 4 个测试全 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/render/zhipu-line.ts tests/zhipu-line.test.js
git commit -m "feat(zhipu): show peak-hour badge during 14-18

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: 编译产物入库 + 冒烟验证

**Files:**
- Modify: `dist/`（编译产物，项目惯例入库）

- [ ] **Step 1: 全量构建**

Run: `npm run build`
Expected: tsc 无错误退出。

- [ ] **Step 2: 全量测试**

Run: `npm test 2>&1 | tail -25`
Expected: 所有测试 PASS，无 fail。

- [ ] **Step 3: 冒烟验证（受当前真实时刻限制）**

Run（用项目自带的 stdin 测试命令，观察智谱行）：

```bash
npm run test:stdin 2>&1 | tail -5
```

Expected: 正常输出智谱行。**若运行时刻恰在 14:00–18:00**，应看到 `⚡高峰 14–18`；否则该标记不出现（符合"按需显示"）。无法人工改时间时，以 Task 5 的单测为正确性凭据。

- [ ] **Step 4: 提交 dist**

```bash
git add dist
git commit -m "build: compile dist/ [auto]

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 验收标准

- 本地时间 14:00–18:00，智谱行末尾出现黄色 `⚡高峰 14–18`；其余时间无该标记。
- `showZhipu` 或 `showZhipuPeakHour` 为 false 时不显示。
- `npm test` 全绿；`isPeakHour` 边界（13/14/17:59:59/18/0 点）覆盖。
- 中英文文案均正确（`高峰` / `Peak`）。
