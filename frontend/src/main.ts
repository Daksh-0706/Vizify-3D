import * as THREE from 'three';
import { Viewer } from './core/viewer';
import { Tracker } from './gestures/tracker';
import { GestureControl } from './gestures/control';
import { MANIFEST, prettyName, type ManifestEntry } from './featured/manifest';
import { builders } from './featured/procedural';
import { ScanClient } from './scan/scanClient';

const $ = (id: string) => document.getElementById(id)!;
const viewerEl = $('viewer');
const viewer = new Viewer(viewerEl);
const tracker = new Tracker();
const control = new GestureControl(viewer);
const scan = new ScanClient(viewer.scene);

let mode: 'featured' | 'scan' | 'tutorial' = 'featured';
let current: ManifestEntry = MANIFEST[0];
let xray = false, scanMode = false;

// ---------- gallery ----------
function renderCats() {
  const cats = ['all', ...new Set(MANIFEST.map(m => m.category))];
  const cf = $('catFilter'); cf.innerHTML = '';
  cats.forEach(c => {
    const b = document.createElement('button'); b.textContent = c;
    b.onclick = () => renderGallery(c);
    cf.appendChild(b);
  });
}
function renderGallery(filter = 'all') {
  const g = $('gallery'); g.innerHTML = '';
  MANIFEST.filter(m => filter === 'all' || m.category === filter).forEach(m => {
    const d = document.createElement('div'); d.className = 'card' + (m.id === current.id ? ' sel' : '');
    d.innerHTML = `<b>${m.title}</b><br/><small>${m.category} · ${m.license} · ${m.author}</small>`;
    d.onclick = () => loadFeatured(m);
    g.appendChild(d);
  });
  $('credits').innerHTML = '<h4>Credits</h4>' + MANIFEST.map(m => `<small>${m.title}: ${m.author} (${m.license})</small>`).join('<br/>');
}

async function loadFeatured(m: ManifestEntry) {
  current = m;
  scanMode = false;
  scan.points.visible = false;
  // Source chain: local cache -> CDN -> fallback host -> procedural.
  // Real dataset models load first; procedural only if downloads fail (offline).
  const urls = [m.local, m.file, m.fileFallback].filter(Boolean) as string[];
  let loaded = false;
  for (const u of urls) {
    try { await viewer.loadGLB(u); loaded = true; break; }
    catch { /* try next source */ }
  }
  if (!loaded) {
    if (m.procedural && builders[m.procedural]) viewer.loadGroup(builders[m.procedural]());
    else { viewer.clear(); }
  }
  renderGallery();
  const sel = $('isolateSel') as HTMLSelectElement;
  sel.innerHTML = '<option value="">All parts</option>' + viewer.partNames().map(n => `<option>${n}</option>`).join('');
  ($('tools') as HTMLElement).style.display = '';
  setExplode(0); setXray(false);
}

// ---------- inspection tools ----------
function setExplode(v: number) {
  ( $('explodeRange') as HTMLInputElement).value = String(v);
  if (current.tools.includes('explode')) viewer.setExplode(v, current.explode.strength);
}
function setXray(on: boolean) {
  xray = on; ($('xrayBtn') as HTMLButtonElement).textContent = 'X-ray: ' + (on ? 'on' : 'off');
  if (current.tools.includes('xray')) viewer.setXray(on);
}
($('explodeRange') as HTMLInputElement).oninput = e => setExplode(parseFloat((e.target as HTMLInputElement).value));
($('sliceRange') as HTMLInputElement).oninput = e => {
  const v = parseFloat((e.target as HTMLInputElement).value);
  viewer.setSlice(v, current.tools.includes('slice') && v < 1.49);
};
($('xrayBtn') as HTMLButtonElement).onclick = () => setXray(!xray);
($('isolateSel') as HTMLSelectElement).onchange = e => viewer.isolate((e.target as HTMLSelectElement).value);
($('resetBtn') as HTMLButtonElement).onclick = () => viewer.reset();
($('flyBtn') as HTMLButtonElement).onclick = () => {
  // fly-inside: dolly toward target, shrink near plane
  const cam = viewer.camera;
  const dir = viewer.controls.target.clone().sub(cam.position).normalize();
  let steps = 40;
  const iv = setInterval(() => {
    cam.position.addScaledVector(dir, 0.06); cam.near = 0.005; cam.updateProjectionMatrix();
    if (--steps <= 0) clearInterval(iv);
  }, 30);
};

// point -> raycast label
const ray = new THREE.Raycaster();
control.onPoint = (x, y) => {
  if (!current.tools.includes('labels')) return;
  ray.setFromCamera(new THREE.Vector2(x * 2 - 1, -(y * 2 - 1)), viewer.camera);
  const hits = ray.intersectObjects(viewer.root.children, true);
  const tip = $('labelTip');
  if (hits.length) {
    const name = (hits[0].object as THREE.Mesh).name || 'part';
    const p = current.parts[name];
    tip.style.display = 'block';
    tip.style.left = (x * viewerEl.clientWidth) + 'px';
    tip.style.top = (y * viewerEl.clientHeight) + 'px';
    // Dataset models have no curated parts: fall back to the real mesh name.
    tip.textContent = p ? `${p.label}: ${p.info}` : `${prettyName(name)} (${current.title})`;
  } else tip.style.display = 'none';
};
control.onSlice = (v) => {
  if (current.tools.includes('slice')) { viewer.setSlice(v, true); ( $('sliceRange') as HTMLInputElement).value = String(v); }
};

// ---------- mode switch ----------
(document.querySelectorAll('#modeSwitch button') as unknown as HTMLButtonElement[]).forEach(b => {
  b.onclick = () => {
    document.querySelectorAll('#modeSwitch button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    mode = b.dataset.mode as typeof mode;
    $('stMode').textContent = mode;
    $('tutorialPanel').hidden = mode !== 'tutorial';
    $('scanPanel').hidden = mode !== 'scan';
    ($('tools') as HTMLElement).style.display = (mode === 'featured') ? '' : 'none';
    if (mode === 'scan') enterScan(); else { scanMode = false; scan.points.visible = false; loadFeatured(current); }
  };
});

function enterScan() {
  scanMode = true;
  scan.points.visible = true;
  viewer.clear();
  refreshScans();
}

async function refreshScans() {
  const list = await scan.listScans();
  const el = $('myScans'); el.innerHTML = '';
  list.forEach(s => {
    const b = document.createElement('button'); b.textContent = s.scan_id; b.style.marginRight = '6px';
    b.onclick = async () => { await viewer.loadGLB(`http://${location.hostname}:8000${s.url}`); };
    el.appendChild(b);
  });
  if (!list.length) el.innerHTML = '<small>No scans yet (backend :8000).</small>';
}

($('scanStart') as HTMLButtonElement).onclick = async () => {
  try { scan.clear(); await scan.connect(); $('scanProg').textContent = 'scanning… move camera around object'; }
  catch (e: any) { $('scanProg').textContent = String(e.message ?? e); }
};
($('scanStop') as HTMLButtonElement).onclick = () => scan.stop();
($('scanFile') as HTMLInputElement).onchange = async (e) => {
  const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return;
  $('scanProg').textContent = 'uploading…';
  try { const url = await scan.uploadVideo(f); $('scanProg').textContent = 'ready: ' + url; refreshScans(); }
  catch (err: any) { $('scanProg').textContent = String(err.message ?? err); }
};
scan.onEvent = s => { $('scanProg').textContent = s; };
scan.onMeshReady = async (url) => {
  scan.points.visible = false;
  await viewer.loadGLB(`http://${location.hostname}:8000${url}`);
  refreshScans();
};

// ---------- camera + gestures ----------
($('camBtn') as HTMLButtonElement).onclick = async () => {
  const video = $('cam') as HTMLVideoElement;
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
  video.srcObject = stream; await video.play();
  await tracker.init(video, $('overlay') as HTMLCanvasElement);
  // live scan frames: downscaled jpeg @ ~8fps
  const c = document.createElement('canvas'); c.width = 320; c.height = 240;
  setInterval(() => {
    if (scanMode && scan.ws?.readyState === 1 && video.videoWidth) {
      c.getContext('2d')!.drawImage(video, 0, 0, 320, 240);
      scan.sendFrame(c.toDataURL('image/jpeg', 0.6).split(',')[1]);
    }
  }, 125);
};
tracker.onHands = (hands) => control.update(hands);
control.onStatus = (g) => {
  $('stGesture').textContent = g;
  ($('gestureLog') as HTMLElement).textContent = `infer ${tracker.inferMs.toFixed(1)}ms`;
};

// fps meter
let frames = 0, t0 = performance.now();
(function fps() {
  frames++;
  if (performance.now() - t0 > 1000) {
    $('stFps').textContent = `${frames} fps render · ${tracker.fps} fps hands`;
    frames = 0; t0 = performance.now();
    $('stClutch').textContent = 'control: ' + (control.enabled ? 'ON' : 'OFF');
  }
  requestAnimationFrame(fps);
})();

// boot
renderCats(); renderGallery(); loadFeatured(current);
