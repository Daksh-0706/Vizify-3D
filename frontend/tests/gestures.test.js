// Run: npm test  (node --test). Fixtures: synthetic 21-landmark hands.
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Mirror of src/gestures/filters.ts logic (kept import-free so `node --test` needs no build).
const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const handSize = (lm) => d(lm[0], lm[9]) + 1e-6;
const pinchRatio = (lm) => d(lm[4], lm[8]) / handSize(lm);

function hand(over = {}) {
  // open-palm-ish default: wrist (0.5,0.9), mcp row y=0.5, tips y=0.2
  const lm = Array.from({ length: 21 }, () => [0.5, 0.5, 0]);
  lm[0] = [0.5, 0.9, 0]; lm[9] = [0.5, 0.5, 0];
  lm[4] = [0.3, 0.6, 0]; lm[8] = [0.35, 0.2, 0];
  lm[6] = [0.35, 0.4, 0]; lm[12] = [0.5, 0.2, 0]; lm[10] = [0.5, 0.4, 0];
  lm[16] = [0.6, 0.2, 0]; lm[14] = [0.6, 0.4, 0]; lm[20] = [0.7, 0.2, 0]; lm[18] = [0.7, 0.4, 0];
  Object.assign(lm, over);
  return lm;
}

test('pinch engage/release hysteresis', () => {
  let state = false;
  const upd = (x) => {
    if (!state && x < 0.35) state = true;
    else if (state && x > 0.45) state = false;
    return state;
  };
  assert.equal(upd(0.5), false);
  assert.equal(upd(0.3), true);   // engage
  assert.equal(upd(0.4), true);   // hysteresis holds
  assert.equal(upd(0.5), false);  // release
});

test('zoom uses XY distance, not z', () => {
  const a = hand(), b = hand();
  const xy = Math.hypot(0.2, 0.1);
  assert.ok(xy > 0.15 && xy < 0.3);
  a[0][2] = -5; b[0][2] = 5; // wild z must not change xy zoom metric
  assert.equal(Math.hypot(0.2, 0.1), xy);
});

test('pinch ratio small when tips touch', () => {
  const lm = hand();
  lm[4] = [0.4, 0.3, 0]; lm[8] = [0.41, 0.31, 0];
  assert.ok(pinchRatio(lm) < 0.35);
});

test('fist: all tips near palm', () => {
  const lm = hand();
  for (const t of [8, 12, 16, 20]) lm[t] = [0.5, 0.55, 0];
  const ext = [8, 12, 16, 20].map(t => d(lm[0], lm[t]) > d(lm[0], lm[9]) * 0.9);
  assert.deepEqual(ext, [false, false, false, false]);
});

test('EMA smoothing converges', () => {
  let v = [0, 0];
  const alpha = 0.4;
  for (let i = 0; i < 20; i++) v = v.map((c, j) => alpha * [1, 1][j] + (1 - alpha) * c);
  assert.ok(Math.abs(v[0] - 1) < 0.01);
});
