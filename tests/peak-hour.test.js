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
