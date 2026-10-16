import * as THREE from 'three';

// Detailed procedural models. Every mesh `name` equals its manifest part key
// (multiple meshes may share a name — isolate/explode/labels treat them as one part).
// No downloads, no license risk, all under ~50k tris each.

function M(color: number, opts: Partial<{ rough: number; metal: number; opacity: number; emissive: number; ei: number; flat: boolean }> = {}) {
  const m = new THREE.MeshStandardMaterial({
    color, roughness: opts.rough ?? 0.55, metalness: opts.metal ?? 0.15,
    transparent: (opts.opacity ?? 1) < 1, opacity: opts.opacity ?? 1,
    flatShading: opts.flat ?? false,
  });
  if (opts.emissive !== undefined) { m.emissive = new THREE.Color(opts.emissive); m.emissiveIntensity = opts.ei ?? 1; }
  return m;
}
function mesh(geo: THREE.BufferGeometry, material: THREE.Material, name: string, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, material);
  m.name = name; m.position.set(x, y, z);
  const mm = material as THREE.MeshStandardMaterial;
  m.userData.origOpacity = mm.opacity ?? 1;
  m.userData.origTransparent = mm.transparent ?? false;
  return m;
}
function canvasTex(size: number, draw: (c: CanvasRenderingContext2D, s: number) => void) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  draw(cv.getContext('2d')!, size);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export const builders: Record<string, () => THREE.Group> = {
  // ---------- ANATOMY: human heart ----------
  heart() {
    const g = new THREE.Group();
    const muscle = () => M(0xb03a2e, { rough: 0.5 });
    const muscleD = () => M(0x7b241c, { rough: 0.6 });
    const vesselR = () => M(0xc0392b, { rough: 0.45 });
    const vesselB = () => M(0x2e86c1, { rough: 0.45 });
    // left ventricle: big cone-ish body
    const lv = mesh(new THREE.SphereGeometry(0.55, 28, 22), muscle(), 'ventricle', -0.08, -0.18, 0);
    lv.scale.set(1, 1.35, 0.95); g.add(lv);
    const lvTip = mesh(new THREE.ConeGeometry(0.34, 0.5, 24), muscleD(), 'ventricle', -0.08, -0.85, 0);
    lvTip.rotation.x = Math.PI; g.add(lvTip);
    // right ventricle: smaller crescent on the right
    const rv = mesh(new THREE.SphereGeometry(0.38, 24, 18), muscleD(), 'ventricle', 0.42, -0.2, 0.12);
    rv.scale.set(0.8, 1.15, 0.85); g.add(rv);
    // atria: two lobes up top with bumpy auricles
    const la = mesh(new THREE.SphereGeometry(0.34, 22, 16), M(0xd35400, { rough: 0.55 }), 'atrium', -0.32, 0.52, 0);
    la.scale.set(1.1, 0.85, 0.95); g.add(la);
    const ra = mesh(new THREE.SphereGeometry(0.36, 22, 16), M(0xe67e22, { rough: 0.55 }), 'atrium', 0.34, 0.5, -0.05);
    ra.scale.set(1.05, 0.9, 0.95); g.add(ra);
    for (let i = 0; i < 6; i++) { // auricle bumps
      const b = mesh(new THREE.SphereGeometry(0.09, 10, 8), M(0xd35400, { rough: 0.6 }), 'atrium',
        -0.55 + (i % 3) * 0.12, 0.62 + Math.floor(i / 3) * 0.12, 0.28);
      g.add(b);
    }
    // aorta: arch (torus) + descending trunk
    const arch = mesh(new THREE.TorusGeometry(0.34, 0.13, 14, 28, Math.PI), vesselR(), 'aorta', 0, 0.95, 0);
    g.add(arch);
    g.add(mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.75, 18), vesselR(), 'aorta', -0.34, 0.72, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.6, 18), vesselR(), 'aorta', 0.34, 0.72, 0));
    // 3 branch arteries off the arch
    [[-0.15], [0], [0.15]].forEach(([x]) =>
      g.add(mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.4, 12), vesselR(), 'aorta', x, 1.32, 0)));
    // pulmonary trunk + vena cava (blue side)
    const pt = mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.65, 16), vesselB(), 'aorta', 0.05, 0.75, 0.3);
    pt.rotation.x = 0.35; g.add(pt);
    g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.55, 14), vesselB(), 'atrium', 0.42, 0.95, -0.25));
    // septum groove line
    const groove = mesh(new THREE.TorusGeometry(0.5, 0.025, 8, 40), M(0x641e16, { rough: 0.7 }), 'ventricle', -0.05, -0.2, 0.02);
    groove.rotation.y = 0.5; groove.scale.set(0.75, 1.25, 1); g.add(groove);
    return g;
  },

  // ---------- MACHINES: V-engine ----------
  engine() {
    const g = new THREE.Group();
    const iron = M(0x5d6d7e, { rough: 0.45, metal: 0.7 });
    const dark = M(0x2c3e50, { rough: 0.5, metal: 0.6 });
    const steel = M(0xbdc3c7, { rough: 0.25, metal: 0.9 });
    // crankcase block with cooling fins
    g.add(mesh(new THREE.BoxGeometry(1.5, 0.8, 0.95), iron, 'block', 0, -0.1, 0));
    for (let i = 0; i < 5; i++)
      g.add(mesh(new THREE.BoxGeometry(1.54, 0.05, 0.99), dark, 'block', 0, -0.38 + i * 0.16, 0));
    // oil pan + front pulley
    g.add(mesh(new THREE.BoxGeometry(1.1, 0.28, 0.7), dark, 'block', 0, -0.62, 0));
    const pulley = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 24), steel, 'block', 0, -0.15, 0.53);
    pulley.rotation.x = Math.PI / 2; g.add(pulley);
    // 4 pistons with connecting rods, alternating heights
    for (let i = 0; i < 4; i++) {
      const x = -0.57 + i * 0.38, h = 0.55 + (i % 2) * 0.22;
      const p = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.3, 20), steel, 'piston', x, h, 0);
      g.add(p);
      g.add(mesh(new THREE.BoxGeometry(0.09, 0.5, 0.09), M(0x7f8c8d, { metal: 0.8, rough: 0.35 }), 'piston', x, h - 0.38, 0));
      // bore sleeve
      const bore = mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.34, 20, 1, true), dark, 'block', x, 0.32, 0);
      (bore.material as THREE.Material).side = THREE.DoubleSide; g.add(bore);
    }
    // cylinder head + valve cover + intake trumpets
    g.add(mesh(new THREE.BoxGeometry(1.6, 0.3, 1.0), dark, 'head', 0, 0.32, 0));
    g.add(mesh(new THREE.BoxGeometry(1.2, 0.18, 0.7), M(0xa93226, { rough: 0.4, metal: 0.4 }), 'head', 0, 0.56, 0));
    for (let i = 0; i < 4; i++) {
      const tr = mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.35, 14), steel, 'head', -0.57 + i * 0.38, 0.82, -0.15);
      tr.rotation.x = -0.4; g.add(tr);
    }
    // exhaust headers curving down the side
    for (let i = 0; i < 4; i++) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.57 + i * 0.38, 0.3, 0.5), new THREE.Vector3(-0.57 + i * 0.38, 0.0, 0.75),
        new THREE.Vector3(-0.57 + i * 0.38, -0.45, 0.7)]);
      g.add(mesh(new THREE.TubeGeometry(curve, 12, 0.055, 10), M(0x935116, { metal: 0.7, rough: 0.4 }), 'head', 0, 0, 0));
    }
    return g;
  },

  // ---------- SPACE: solar system ----------
  solar() {
    const g = new THREE.Group();
    // sun with procedural plasma texture + glow shell
    const sunTex = canvasTex(256, (c, s) => {
      const gr = c.createRadialGradient(s/2, s/2, 10, s/2, s/2, s/2);
      gr.addColorStop(0, '#fff7cc'); gr.addColorStop(0.4, '#ffb300'); gr.addColorStop(1, '#e65100');
      c.fillStyle = gr; c.fillRect(0, 0, s, s);
      c.fillStyle = 'rgba(255,80,0,0.35)';
      for (let i = 0; i < 40; i++) { c.beginPath(); c.arc(Math.random()*s, Math.random()*s, 4+Math.random()*10, 0, 7); c.fill(); }
    });
    const sunMat = new THREE.MeshBasicMaterial({ map: sunTex });
    g.add(mesh(new THREE.SphereGeometry(0.55, 36, 24), sunMat, 'sun'));
    const glow = mesh(new THREE.SphereGeometry(0.68, 24, 18),
      new THREE.MeshBasicMaterial({ color: 0xff9800, transparent: true, opacity: 0.22 }), 'sun');
    glow.userData.origOpacity = 0.22; glow.userData.origTransparent = true; g.add(glow);
    // earth: blue marble canvas texture + moon
    const earthTex = canvasTex(256, (c, s) => {
      c.fillStyle = '#1565c0'; c.fillRect(0, 0, s, s);
      c.fillStyle = '#2e7d32';
      for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse(Math.random()*s, Math.random()*s, 12+Math.random()*26, 8+Math.random()*16, Math.random()*3, 0, 7); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(0, 0, s, 12); c.fillRect(0, s-12, s, 12);
    });
    const earth = mesh(new THREE.SphereGeometry(0.2, 28, 20),
      new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.7 }), 'earth', 1.35, 0.1, 0);
    g.add(earth);
    g.add(mesh(new THREE.SphereGeometry(0.055, 14, 10), M(0x9e9e9e, { rough: 0.9 }), 'earth', 1.62, 0.25, 0.1));
    // mars with polar cap + saturn-style ringed planet for wow
    g.add(mesh(new THREE.SphereGeometry(0.15, 24, 18), M(0xc1440e, { rough: 0.85 }), 'mars', -1.15, -0.15, 0.2));
    g.add(mesh(new THREE.SphereGeometry(0.07, 12, 10), M(0xeeeeee, { rough: 0.9 }), 'mars', -1.15, -0.02, 0.2));
    const sat = mesh(new THREE.SphereGeometry(0.24, 28, 20), M(0xd4a017, { rough: 0.6 }), 'mars', -1.9, 0.5, -0.4);
    g.add(sat);
    const ring = mesh(new THREE.RingGeometry(0.3, 0.48, 48),
      new THREE.MeshStandardMaterial({ color: 0xf5e6a3, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }),
      'mars', -1.9, 0.5, -0.4);
    ring.userData.origOpacity = 0.85; ring.userData.origTransparent = true;
    ring.rotation.x = 1.2; g.add(ring);
    // orbit paths
    for (const r of [1.35, 1.95]) {
      const o = mesh(new THREE.RingGeometry(r - 0.006, r + 0.006, 96),
        new THREE.MeshBasicMaterial({ color: 0x3a4a5a, side: THREE.DoubleSide, transparent: true, opacity: 0.6 }),
        'sun', 0, 0, 0);
      o.userData.origOpacity = 0.6; o.userData.origTransparent = true;
      o.rotation.x = Math.PI / 2; g.add(o);
    }
    return g;
  },

  // ---------- ELECTRONICS: phone teardown ----------
  phone() {
    const g = new THREE.Group();
    // display: frame + live UI texture
    g.add(mesh(new THREE.BoxGeometry(0.85, 1.7, 0.07), M(0x111418, { rough: 0.35, metal: 0.5 }), 'screen', 0, 0, 0));
    const uiTex = canvasTex(256, (c, s) => {
      const gr = c.createLinearGradient(0, 0, 0, s); gr.addColorStop(0, '#0d47a1'); gr.addColorStop(1, '#311b92');
      c.fillStyle = gr; c.fillRect(0, 0, s, s);
      c.fillStyle = 'rgba(255,255,255,0.9)'; c.font = '28px sans-serif'; c.fillText('09:41', 20, 50);
      const cols = ['#ff5252', '#ffd740', '#69f0ae', '#40c4ff'];
      cols.forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.roundRect(20 + i * 58, 90, 46, 46, 10); c.fill(); });
      c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(20, 170, 216, 60);
    });
    const scr = mesh(new THREE.PlaneGeometry(0.76, 1.6),
      new THREE.MeshStandardMaterial({ map: uiTex, roughness: 0.15, metalness: 0.1, emissive: 0xffffff, emissiveMap: uiTex, emissiveIntensity: 0.55 }),
      'screen', 0, 0, 0.037);
    g.add(scr);
    // battery: silver pouch + label stripe
    g.add(mesh(new THREE.BoxGeometry(0.62, 1.0, 0.1), M(0xb0bec5, { metal: 0.6, rough: 0.35 }), 'battery', 0, -0.15, -0.12));
    g.add(mesh(new THREE.BoxGeometry(0.62, 0.25, 0.102), M(0x2e7d32, { rough: 0.6 }), 'battery', 0, 0.05, -0.12));
    // mainboard with chips, cameras, screws
    g.add(mesh(new THREE.BoxGeometry(0.7, 0.42, 0.05), M(0x1b5e20, { rough: 0.55 }), 'board', 0, 0.55, -0.1));
    const chip = M(0x212121, { rough: 0.4 });
    g.add(mesh(new THREE.BoxGeometry(0.2, 0.2, 0.04), chip, 'board', -0.12, 0.55, -0.06));
    g.add(mesh(new THREE.BoxGeometry(0.12, 0.28, 0.03), chip, 'board', 0.18, 0.55, -0.06));
    for (const [x, y] of [[-0.28, 0.68], [0.28, 0.68], [-0.28, 0.42], [0.28, 0.42]])
      g.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 10), M(0x90a4ae, { metal: 0.9, rough: 0.3 }), 'board', x, y, -0.06));
    // dual camera module
    for (const y of [0.62, 0.48]) {
      const cam = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 24), M(0x0d0d0d, { rough: 0.2, metal: 0.6 }), 'board', 0.05, y, -0.02);
      cam.rotation.x = Math.PI / 2; g.add(cam);
      const lens = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.065, 20),
        new THREE.MeshStandardMaterial({ color: 0x0a1929, roughness: 0.05, metalness: 0.9 }), 'board', 0.05, y, -0.02);
      lens.rotation.x = Math.PI / 2; g.add(lens);
    }
    return g;
  },

  // ---------- BIOLOGY: animal cell ----------
  cell() {
    const g = new THREE.Group();
    // membrane: double-layer translucent shell
    const membMat = M(0x4db6ac, { opacity: 0.28, rough: 0.3 });
    const memb = mesh(new THREE.SphereGeometry(0.95, 36, 24), membMat, 'membrane');
    memb.userData.origOpacity = 0.28; memb.userData.origTransparent = true;
    (memb.material as THREE.Material).side = THREE.DoubleSide; g.add(memb);
    // surface proteins studs
    for (let i = 0; i < 26; i++) {
      const th = Math.acos(2 * Math.random() - 1), ph = Math.random() * Math.PI * 2;
      const p = mesh(new THREE.SphereGeometry(0.045, 8, 6), M(0xff8a65, { rough: 0.5 }), 'membrane',
        0.95 * Math.sin(th) * Math.cos(ph), 0.95 * Math.cos(th), 0.95 * Math.sin(th) * Math.sin(ph));
      g.add(p);
    }
    // nucleus + nucleolus + chromatin blobs
    g.add(mesh(new THREE.SphereGeometry(0.38, 28, 20), M(0x7e57c2, { rough: 0.45 }), 'nucleus', -0.1, 0.05, 0));
    g.add(mesh(new THREE.SphereGeometry(0.15, 18, 14), M(0x4527a0, { rough: 0.4 }), 'nucleus', -0.1, 0.05, 0.1));
    // mitochondria: 2 capsules with cristae ridges
    for (const [x, y, z, ry] of [[0.5, 0.3, 0.25, 0.6], [0.35, -0.4, -0.3, -0.5]] as const) {
      const mt = mesh(new THREE.CapsuleGeometry(0.13, 0.3, 6, 14), M(0xfb8c00, { rough: 0.5 }), 'mito', x, y, z);
      mt.rotation.z = ry; g.add(mt);
      for (let k = -1; k <= 1; k++) {
        const cr = mesh(new THREE.TorusGeometry(0.09, 0.02, 8, 18), M(0xe65100, { rough: 0.5 }), 'mito', x + k * 0.08, y, z);
        cr.rotation.y = Math.PI / 2; cr.rotation.z = ry; g.add(cr);
      }
    }
    // rough ER: stacked curved sacs near nucleus
    for (let i = 0; i < 4; i++) {
      const er = mesh(new THREE.TorusGeometry(0.45 + i * 0.09, 0.045, 10, 30, Math.PI * 1.2),
        M(0x66bb6a, { rough: 0.55 }), 'membrane', -0.1, -0.15 - i * 0.02, -0.1);
      er.rotation.x = Math.PI / 2 + 0.25 * i; g.add(er);
    }
    return g;
  },

  // ---------- ARCHITECTURE: section house ----------
  house() {
    const g = new THREE.Group();
    const wall = M(0xf5f0e6, { rough: 0.8 });
    const wood = M(0x8d6e63, { rough: 0.7 });
    const glassM = new THREE.MeshStandardMaterial({ color: 0xb3e5fc, roughness: 0.1, metalness: 0.3, emissive: 0x4fc3f7, emissiveIntensity: 0.5 });
    // floor 1: walls + door + windows + interior sofa/table silhouettes
    g.add(mesh(new THREE.BoxGeometry(1.7, 0.55, 1.3), wall, 'floor1', 0, -0.35, 0));
    g.add(mesh(new THREE.BoxGeometry(0.3, 0.45, 0.04), wood, 'floor1', -0.4, -0.38, 0.66));
    for (const x of [-0.65, 0.1, 0.6]) g.add(mesh(new THREE.PlaneGeometry(0.28, 0.28), glassM, 'floor1', x, -0.3, 0.66));
    g.add(mesh(new THREE.BoxGeometry(0.5, 0.18, 0.25), M(0x3949ab, { rough: 0.7 }), 'floor1', 0.3, -0.5, 0.1)); // sofa
    g.add(mesh(new THREE.BoxGeometry(0.3, 0.12, 0.3), wood, 'floor1', -0.3, -0.55, -0.1)); // table
    // floor 2: walls + balcony slab + railing + beds
    g.add(mesh(new THREE.BoxGeometry(1.7, 0.55, 1.3), M(0xffe0b2, { rough: 0.8 }), 'floor2', 0, 0.25, 0));
    for (const x of [-0.5, 0.5]) g.add(mesh(new THREE.PlaneGeometry(0.34, 0.3), glassM, 'floor2', x, 0.3, 0.66));
    g.add(mesh(new THREE.BoxGeometry(1.7, 0.06, 0.4), wood, 'floor2', 0, 0.02, 0.85)); // balcony
    for (let i = 0; i < 8; i++)
      g.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6), wood, 'floor2', -0.8 + i * 0.23, 0.2, 1.03));
    g.add(mesh(new THREE.BoxGeometry(0.55, 0.2, 0.4), M(0x00897b, { rough: 0.7 }), 'floor2', -0.4, 0.08, -0.2)); // bed
    g.add(mesh(new THREE.BoxGeometry(0.35, 0.1, 0.3), M(0xffffff, { rough: 0.9 }), 'floor2', -0.4, 0.22, -0.2)); // pillow
    // staircase between floors
    for (let i = 0; i < 5; i++)
      g.add(mesh(new THREE.BoxGeometry(0.3, 0.05, 0.18), wood, 'floor1', 0.6, -0.55 + i * 0.11, -0.4 + i * 0.02));
    // roof: hip tiles + chimney + skylight
    const roofM = M(0xb71c1c, { rough: 0.65, flat: true });
    const roof = mesh(new THREE.ConeGeometry(1.35, 0.65, 4), roofM, 'roof', 0, 0.85, 0);
    roof.rotation.y = Math.PI / 4; g.add(roof);
    g.add(mesh(new THREE.BoxGeometry(0.18, 0.5, 0.18), M(0x6d4c41, { rough: 0.8 }), 'roof', 0.45, 1.0, -0.2));
    const sky = mesh(new THREE.PlaneGeometry(0.35, 0.25), glassM, 'roof', -0.3, 0.92, 0.45);
    sky.rotation.x = -0.6; sky.rotation.y = Math.PI / 4; g.add(sky);
    return g;
  },

  // ---------- VEHICLES: sports car ----------
  car() {
    const g = new THREE.Group();
    const paint = M(0xd32f2f, { rough: 0.25, metal: 0.5 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x101418, roughness: 0.08, metalness: 0.7 });
    // lower body + nose wedge + cabin
    g.add(mesh(new THREE.BoxGeometry(1.9, 0.34, 0.85), paint, 'body', 0, 0.12, 0));
    const nose = mesh(new THREE.BoxGeometry(0.5, 0.22, 0.8), paint, 'body', 1.05, 0.08, 0);
    nose.rotation.z = -0.15; g.add(nose);
    const cabin = mesh(new THREE.BoxGeometry(0.95, 0.3, 0.72), glass, 'body', -0.15, 0.42, 0);
    g.add(cabin);
    // headlights + taillight bar + grille + mirrors + spoiler
    const lightM = new THREE.MeshStandardMaterial({ color: 0xfffde7, emissive: 0xffee58, emissiveIntensity: 1.4 });
    for (const z of [0.28, -0.28]) g.add(mesh(new THREE.SphereGeometry(0.07, 12, 10), lightM, 'body', 1.22, 0.12, z));
    g.add(mesh(new THREE.BoxGeometry(0.04, 0.08, 0.7), new THREE.MeshStandardMaterial({ color: 0xff1744, emissive: 0xff1744, emissiveIntensity: 1.2 }), 'body', -0.96, 0.18, 0));
    g.add(mesh(new THREE.BoxGeometry(0.3, 0.1, 0.5), M(0x212121, { rough: 0.6 }), 'body', 1.28, -0.02, 0));
    for (const z of [0.45, -0.45]) g.add(mesh(new THREE.BoxGeometry(0.12, 0.06, 0.06), paint, 'body', -0.15, 0.42, z));
    g.add(mesh(new THREE.BoxGeometry(0.08, 0.06, 0.8), paint, 'body', -1.0, 0.42, 0));
    // wheels: tire + rim + spokes + brake disc
    for (const [x, z] of [[-0.62, 0.46], [0.62, 0.46], [-0.62, -0.46], [0.62, -0.46]] as const) {
      const tire = mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 28), M(0x161616, { rough: 0.9 }), 'wheel', x, -0.1, z);
      tire.rotation.x = Math.PI / 2; g.add(tire);
      const rim = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.17, 20), M(0xcfd8dc, { metal: 0.9, rough: 0.25 }), 'wheel', x, -0.1, z);
      rim.rotation.x = Math.PI / 2; g.add(rim);
      for (let s = 0; s < 5; s++) {
        const sp = mesh(new THREE.BoxGeometry(0.03, 0.22, 0.18), M(0x37474f, { metal: 0.8, rough: 0.3 }), 'wheel', x, -0.1, z);
        sp.rotation.z = (s / 5) * Math.PI * 2; g.add(sp);
      }
    }
    // motor: block + head + turbo + exhaust
    g.add(mesh(new THREE.BoxGeometry(0.6, 0.35, 0.5), M(0x78909c, { metal: 0.7, rough: 0.4 }), 'motor', 0, 0.32, 0));
    for (let i = 0; i < 4; i++)
      g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 10), M(0x37474f, { metal: 0.8, rough: 0.3 }), 'motor', -0.2 + i * 0.13, 0.55, 0));
    const turbo = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.14, 18), M(0x8d6e63, { metal: 0.85, rough: 0.3 }), 'motor', 0.42, 0.3, 0);
    turbo.rotation.z = Math.PI / 2; g.add(turbo);
    const exh = mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.7, 12), M(0x9e9e9e, { metal: 0.9, rough: 0.25 }), 'motor', -0.3, 0.05, -0.3);
    exh.rotation.z = Math.PI / 2; g.add(exh);
    return g;
  },

  // ---------- GEOLOGY: volcano + crystal ----------
  volcano() {
    const g = new THREE.Group();
    const rockM = M(0x6d4c41, { rough: 0.95, flat: true });
    // stratified cone: stacked rings alternating rock/ash tones
    const tones = [0x6d4c41, 0x8d6e63, 0x5d4037, 0xa1887f];
    for (let i = 0; i < 7; i++) {
      const r = 0.95 - i * 0.115, y = -0.45 + i * 0.17;
      g.add(mesh(new THREE.CylinderGeometry(r - 0.115, r, 0.19, 24, 1, true), M(tones[i % 4], { rough: 0.95, flat: true }), 'cone', 0, y, 0));
    }
    // crater rim + glowing lava lake + flow tongue
    g.add(mesh(new THREE.TorusGeometry(0.16, 0.06, 12, 24), rockM, 'cone', 0, 0.75, 0)).children;
    (g.children[g.children.length - 1] as THREE.Mesh).rotation.x = Math.PI / 2;
    const lake = mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.03, 20),
      new THREE.MeshStandardMaterial({ color: 0xff3d00, emissive: 0xff6d00, emissiveIntensity: 2 }), 'chamber', 0, 0.74, 0);
    g.add(lake);
    const flow = mesh(new THREE.BoxGeometry(0.16, 0.04, 0.9), new THREE.MeshStandardMaterial({ color: 0xdd2c00, emissive: 0xff5722, emissiveIntensity: 1.2, roughness: 0.6 }), 'chamber', 0.1, 0.05, 0.55);
    flow.rotation.x = 0.5; flow.rotation.y = 0.15; g.add(flow);
    // magma chamber + conduit
    g.add(mesh(new THREE.SphereGeometry(0.34, 20, 14), new THREE.MeshStandardMaterial({ color: 0xff5722, emissive: 0xff3d00, emissiveIntensity: 1.5, roughness: 0.5 }), 'chamber', 0, -0.75, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.09, 0.16, 0.6, 14), M(0xe64a19, { rough: 0.6, emissive: 0xbf360c, ei: 0.7 }), 'chamber', 0, -0.35, 0));
    // crystal cluster: quartz-like prisms with glass material
    const quartz = new THREE.MeshStandardMaterial({ color: 0x80deea, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.9, flatShading: true, emissive: 0x00838f, emissiveIntensity: 0.25 });
    const q1 = mesh(new THREE.OctahedronGeometry(0.22), quartz, 'crystal', 1.15, 0.1, 0);
    const q2 = mesh(new THREE.OctahedronGeometry(0.15), quartz, 'crystal', 1.38, -0.05, 0.12);
    const q3 = mesh(new THREE.OctahedronGeometry(0.12), M(0xce93d8, { rough: 0.2, flat: true }), 'crystal', 0.95, -0.08, -0.12);
    q1.userData.origOpacity = q2.userData.origOpacity = 0.9; q1.userData.origTransparent = q2.userData.origTransparent = true;
    g.add(q1, q2, q3);
    g.add(mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.12, 18), M(0x4e342e, { rough: 0.9 }), 'crystal', 1.15, -0.22, 0));
    return g;
  },
};
