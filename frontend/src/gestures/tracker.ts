import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { EMA, Debounced, classify, pinchRatio, handSize, type Gesture } from './filters';

export interface HandState {
  present: boolean;
  lm?: number[][];      // smoothed 21x3 (normalized)
  raw?: number[][];
  gesture: Gesture;
  pinch: number;
  size: number;
  center: { x: number; y: number };
}

export class Tracker {
  landmarker: HandLandmarker | null = null;
  hands: HandState[] = [{ present: false, gesture: 'none', pinch: 0, size: 0, center: { x: 0, y: 0 } }];
  private emas = [new EMA(0.4), new EMA(0.4)];
  private deb = [new Debounced(3), new Debounced(3)];
  onHands: (h: HandState[]) => void = () => {};
  fps = 0; inferMs = 0;
  private lastT = performance.now(); private nF = 0; private t0 = performance.now();

  async init(video: HTMLVideoElement, overlay: HTMLCanvasElement) {
    const files = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm');
    this.landmarker = await HandLandmarker.createFromOptions(files, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO', numHands: 2,
      minHandDetectionConfidence: 0.5, minTrackingConfidence: 0.5
    });
    const ctx = overlay.getContext('2d')!;
    const tick = async () => {
      if (video.readyState >= 2 && video.videoWidth) {
        const t = performance.now();
        const res = this.landmarker!.detectForVideo(video, t);
        this.inferMs = performance.now() - t;
        overlay.width = video.videoWidth; overlay.height = video.videoHeight;
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        ctx.drawImage(video, 0, 0, overlay.width, overlay.height);
        const out: HandState[] = [];
        (res.landmarks ?? []).slice(0, 2).forEach((hand, hi) => {
          const raw = hand.map(p => [p.x, p.y, p.z ?? 0]);
          const sm = this.emas[hi].apply(raw);
          const g = this.deb[hi].update(classify(sm));
          const cx = sm.reduce((s, p) => s + p[0], 0) / sm.length;
          const cy = sm.reduce((s, p) => s + p[1], 0) / sm.length;
          // overlay skeleton
          ctx.fillStyle = hi ? '#5cc8ff' : '#ffd166';
          sm.forEach(p => { ctx.beginPath(); ctx.arc(p[0]*overlay.width, p[1]*overlay.height, 4, 0, 7); ctx.fill(); });
          out[hi] = { present: true, lm: sm, raw, gesture: g, pinch: pinchRatio(sm), size: handSize(sm), center: { x: cx, y: cy } };
        });
        while (out.length < 2) out.push({ present: false, gesture: 'none', pinch: 0, size: 0, center: { x: 0, y: 0 } });
        this.hands = out;
        this.onHands(out);
        this.nF++;
        if (performance.now() - this.t0 > 1000) { this.fps = this.nF; this.nF = 0; this.t0 = performance.now(); }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
