import type { Viewer } from '../core/viewer';
import type { HandState } from './tracker';

// Clutch: thumbs-up toggles control. Everything else only applies when enabled.
export class GestureControl {
  enabled = false;
  private lastPinch = new Map<number, { x: number; y: number }>();
  private lastPalm = new Map<number, { x: number; y: number }>();
  private lastZoom = 0;
  private lastThumb = 0;
  onStatus: (g: string) => void = () => {};
  onPoint: (x: number, y: number) => void = () => {};
  explodeMode = false; sliceMode = false;
  onExplode: (v: number) => void = () => {};
  onSlice: (v: number) => void = () => {};
  explodeVal = 0;

  constructor(private viewer: Viewer) {}

  update(hands: HandState[]) {
    const [a, b] = hands;
    // clutch on thumbs-up (either hand), debounced by time
    if ((a.gesture === 'thumbsup' || b.gesture === 'thumbsup') && performance.now() - this.lastThumb > 900) {
      this.enabled = !this.enabled;
      this.lastThumb = performance.now();
    }
    let status: string = a.present ? a.gesture : 'none';
    if (a.present && b.present) status = `${a.gesture}+${b.gesture}`;
    if (!this.enabled) { this.onStatus(status + ' (clutch OFF: thumbs-up to enable)'); return; }

    // two-hand pinch zoom (uses XY distance, never z)
    if (a.present && b.present && a.gesture === 'pinch' && b.gesture === 'pinch') {
      const dist = Math.hypot(a.center.x - b.center.x, a.center.y - b.center.y);
      if (this.lastZoom) {
        const k = dist / this.lastZoom;
        this.viewer.camera.position.multiplyScalar(1 / Math.max(0.85, Math.min(1.18, k)));
        status = 'zoom';
      }
      this.lastZoom = dist;
      if (this.explodeMode) { // spread also drives exploded view
        this.explodeVal = Math.max(0, Math.min(2, this.explodeVal + (dist - (this as any)._ez || dist) * 0));
        (this as any)._ez = dist;
      }
      this.onStatus(status); return;
    }
    this.lastZoom = 0;

    const h = a.present ? a : b;
    const hi = a.present ? 0 : 1;
    if (!h.present) { this.onStatus(status); return; }

    if (h.gesture === 'pinch') {
      const p = this.lastPinch.get(hi);
      if (p) {
        const dx = (h.center.x - p.x) * 6, dy = (h.center.y - p.y) * 6;
        this.viewer.root.rotation.y += dx;
        this.viewer.root.rotation.x += dy;
        status = 'rotate';
      }
      this.lastPinch.set(hi, { ...h.center });
    } else this.lastPinch.delete(hi);

    if (h.gesture === 'palm') {
      const p = this.lastPalm.get(hi);
      if (p) {
        const dx = (h.center.x - p.x) * 2, dy = (h.center.y - p.y) * 2;
        this.viewer.controls.target.x -= dx;
        this.viewer.controls.target.y += dy;
        status = 'pan';
      }
      this.lastPalm.set(hi, { ...h.center });
      if (this.sliceMode) this.onSlice(h.center.y * 3 - 1.5);
    } else this.lastPalm.delete(hi);

    if (h.gesture === 'fist') { this.viewer.reset(); status = 'reset'; }
    if (h.gesture === 'point') { this.onPoint(h.center.x, h.center.y); status = 'point'; }

    this.onStatus(status);
  }
}
