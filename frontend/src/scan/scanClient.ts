import * as THREE from 'three';

// Live point-cloud layer (THREE.Points) + WS client per docs/SCAN_CONTRACT.md.
export class ScanClient {
  ws: WebSocket | null = null;
  points: THREE.Points;
  private geo = new THREE.BufferGeometry();
  private pos: number[] = []; private col: number[] = [];
  private cap = 60000; // vertices cap
  onEvent: (s: string) => void = () => {};
  onMeshReady: (url: string) => void = () => {};

  constructor(scene: THREE.Scene) {
    const m = new THREE.PointsMaterial({ size: 0.02, vertexColors: true });
    this.points = new THREE.Points(this.geo, m);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  get url() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${location.hostname}:8000/ws/scan`;
  }

  connect(): Promise<void> {
    return new Promise((res, rej) => {
      try { this.ws = new WebSocket(this.url); }
      catch (e) { rej(e); return; }
      this.ws.onopen = () => { this.ws!.send(JSON.stringify({ type: 'start_scan', options: { resolution: 640, mode: 'live' } })); res(); };
      this.ws.onerror = () => rej(new Error('WS failed; is backend running on :8000?'));
      this.ws.onmessage = (ev) => {
        const m = JSON.parse(ev.data);
        if (m.type === 'points') {
          for (let i = 0; i < m.positions.length; i += 3) {
            if (this.pos.length / 3 >= this.cap) break;
            this.pos.push(m.positions[i], m.positions[i + 1], m.positions[i + 2]);
          }
          for (let i = 0; i < m.colors.length; i += 3) {
            if (this.col.length / 3 >= this.cap) break;
            this.col.push(m.colors[i], m.colors[i + 1], m.colors[i + 2]);
          }
          this.geo.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
          this.geo.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
          this.geo.computeBoundingSphere();
        } else if (m.type === 'progress') {
          this.onEvent(`tracking: ${m.frames} frames · coverage ${(m.coverage * 100) | 0}%`);
        } else if (m.type === 'mesh_ready') {
          this.onEvent(`mesh ready: ${m.url}`);
          this.onMeshReady(m.url);
        } else if (m.type === 'error') this.onEvent('error: ' + m.message);
      };
    });
  }

  sendFrame(jpegB64: string) {
    if (this.ws?.readyState === 1) this.ws.send(JSON.stringify({ type: 'frame', t: Date.now(), data: jpegB64 }));
  }
  stop() { this.ws?.send(JSON.stringify({ type: 'stop_scan' })); }
  clear() { this.pos = []; this.col = []; this.geo.deleteAttribute('position'); this.geo.deleteAttribute('color'); }

  async uploadVideo(file: File): Promise<string> {
    const fd = new FormData(); fd.append('video', file);
    const r = await fetch(`http://${location.hostname}:8000/scan/upload`, { method: 'POST', body: fd });
    if (!r.ok) throw new Error('upload failed: ' + r.status);
    const j = await r.json();
    this.onMeshReady(j.url);
    return j.url;
  }
  async listScans(): Promise<{ scan_id: string; url: string }[]> {
    try {
      const r = await fetch(`http://${location.hostname}:8000/scans`);
      return await r.json();
    } catch { return []; }
  }
}
