// EMA + OneEuro (simplified) smoothing for 21 landmarks.
export class EMA {
  v: number[][] | null = null;
  constructor(public alpha = 0.35) {}
  apply(lm: number[][]): number[][] {
    if (!this.v) { this.v = lm.map(p => [...p]); return this.v; }
    this.v = this.v.map((p, i) => p.map((c, j) => this.alpha * lm[i][j] + (1 - this.alpha) * c));
    return this.v;
  }
}

// Hysteresis boolean: engage above hi, release below lo.
export class Hyst {
  state = false;
  constructor(public hi: number, public lo: number) {}
  update(x: number): boolean {
    if (!this.state && x > this.hi) this.state = true;
    else if (this.state && x < this.lo) this.state = false;
    return this.state;
  }
}

const d = (a: number[], b: number[]) => Math.hypot(a[0]-b[0], a[1]-b[1], (a[2]-b[2])*0.5);

export function handSize(lm: number[][]): number {
  return d(lm[0], lm[9]) + 1e-6; // wrist->middle MCP as scale (never use z for zoom)
}

export function pinchRatio(lm: number[][]): number {
  return d(lm[4], lm[8]) / handSize(lm); // thumb tip - index tip
}

export function fingerExtended(lm: number[][], tip: number, pip: number): boolean {
  // extended if tip farther from wrist than pip joint
  return d(lm[0], lm[tip]) > d(lm[0], lm[pip]) * 1.08;
}

export type Gesture = 'none'|'pinch'|'palm'|'fist'|'point'|'thumbsup';

export function classify(lm: number[][]): Gesture {
  const ext = [
    fingerExtended(lm, 8, 6), fingerExtended(lm, 12, 10),
    fingerExtended(lm, 16, 14), fingerExtended(lm, 20, 18),
  ];
  const thumbOut = d(lm[4], lm[0]) > handSize(lm) * 1.1;
  const nExt = ext.filter(Boolean).length;
  const pinch = pinchRatio(lm) < 0.35;
  if (pinch && !ext[1] && !ext[2]) return 'pinch';
  if (nExt === 0 && !thumbOut) return 'fist';
  if (nExt >= 4) return 'palm';
  if (ext[0] && !ext[1] && !ext[2] && !ext[3]) return 'point';
  if (thumbOut && nExt === 0) return 'thumbsup';
  return 'none';
}

// Debounce: gesture must repeat N frames before it commits.
export class Debounced {
  cur: Gesture = 'none'; n = 0;
  constructor(public need = 3) {}
  update(g: Gesture): Gesture {
    if (g === this.cur) { this.n++; return this.n >= this.need ? this.cur : this.cur; }
    this.cur = g; this.n = 1;
    return this.cur;
  }
}
