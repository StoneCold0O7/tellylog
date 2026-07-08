/* Node tests for refreshGate.js, the v2.7.0 AI cost guardrail.
   Run: node tests/refreshGate.test.js */
'use strict';
import assert from 'node:assert';
import { refreshDecision, REFRESH_MIN_DAYS, REFRESH_MIN_UNITS, policyLine } from '../src/lib/refreshGate.js';

let passed = 0;
function t(name, fn) { fn(); passed++; console.log('  \u2713 ' + name); }

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1750000000000;

t('no cache: generate immediately (first-run immediacy)', () => {
  assert.strictEqual(refreshDecision(null, 'h1', 10, NOW), 'generate');
  assert.strictEqual(refreshDecision({}, 'h1', 10, NOW), 'generate');
});

t('unchanged hash: serve fresh regardless of age', () => {
  const cached = { h: 'h1', ts: NOW - 400 * DAY, u: 0 };
  assert.strictEqual(refreshDecision(cached, 'h1', 999, NOW), 'serve-fresh');
});

t('changed hash but too recent: serve stale even with a huge delta', () => {
  const cached = { h: 'h1', ts: NOW - (REFRESH_MIN_DAYS - 1) * DAY, u: 0 };
  assert.strictEqual(refreshDecision(cached, 'h2', 100, NOW), 'serve-stale');
});

t('changed hash, old enough but too little movement: serve stale', () => {
  const cached = { h: 'h1', ts: NOW - (REFRESH_MIN_DAYS + 1) * DAY, u: 10 };
  assert.strictEqual(refreshDecision(cached, 'h2', 10 + REFRESH_MIN_UNITS - 1, NOW), 'serve-stale');
});

t('changed hash, old enough AND moved enough: generate', () => {
  const cached = { h: 'h1', ts: NOW - REFRESH_MIN_DAYS * DAY, u: 10 };
  assert.strictEqual(refreshDecision(cached, 'h2', 10 + REFRESH_MIN_UNITS, NOW), 'generate');
});

t('pre-2.7.0 cache without units: only the days gate applies once', () => {
  const legacyYoung = { h: 'h1', ts: NOW - 1 * DAY };
  const legacyOld = { h: 'h1', ts: NOW - (REFRESH_MIN_DAYS + 1) * DAY };
  assert.strictEqual(refreshDecision(legacyYoung, 'h2', 3, NOW), 'serve-stale');
  assert.strictEqual(refreshDecision(legacyOld, 'h2', 3, NOW), 'generate');
});

t('policyLine states the day threshold verbatim', () => {
  assert.ok(policyLine().indexOf(String(REFRESH_MIN_DAYS) + ' days') !== -1);
});

console.log('\nAll ' + passed + ' tests passed.');
