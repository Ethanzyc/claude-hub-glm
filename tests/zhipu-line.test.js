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
});
