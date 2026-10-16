import * as THREE from 'three';

// Procedural multi-part models. Part names match manifest `parts` keys.
// Keeps the app runnable offline; real CC0 GLBs can replace any entry via `file`.
function mat(c: number, o = 1) {
  return new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0.15, transparent: o < 1, opacity: o });
}
function mesh(geo: THREE.BufferGeometry, color: number, name: string, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat(color));
  m.name = name; m.position.set(x, y, z);
  m.userData.origOpacity = 1; m.userData.origTransparent = false;
  return m;
}

export const builders: Record<string, () => THREE.Group> = {
  heart() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.SphereGeometry(0.55, 24, 18), 0xc0392b, 'ventricle', 0, -0.1, 0));
    g.add(mesh(new THREE.SphereGeometry(0.4, 20, 14), 0xe67e22, 'atrium', 0, 0.5, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.9, 16), 0x2980b9, 'aorta', 0.15, 0.9, 0));
    return g;
  },
  engine() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(1.4, 0.9, 0.9), 0x7f8c8d, 'block'));
    for (let i = -1; i <= 1; i++) g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.7, 16), 0xbdc3c7, 'piston', i * 0.42, 0.7, 0));
    g.add(mesh(new THREE.BoxGeometry(1.5, 0.25, 1.0), 0x2c3e50, 'head', 0, 1.15, 0));
    return g;
  },
  solar() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.SphereGeometry(0.5, 24, 18), 0xf39c12, 'sun'));
    g.add(mesh(new THREE.SphereGeometry(0.18, 18, 14), 0x2980b9, 'earth', 1.2, 0, 0));
    g.add(mesh(new THREE.SphereGeometry(0.14, 18, 14), 0xe74c3c, 'mars', -1.6, 0.2, 0));
    return g;
  },
  phone() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(0.8, 1.6, 0.06), 0x3498db, 'screen', 0, 0, 0.2));
    g.add(mesh(new THREE.BoxGeometry(0.6, 1.0, 0.12), 0x27ae60, 'battery', 0, -0.1, 0));
    g.add(mesh(new THREE.BoxGeometry(0.7, 0.4, 0.05), 0x8e44ad, 'board', 0, 0.5, -0.05));
    return g;
  },
  cell() {
    const g = new THREE.Group();
    const memb = mesh(new THREE.SphereGeometry(0.9, 24, 18), 0x1abc9c, 'membrane'); memb.material = mat(0x1abc9c, 0.35); memb.userData.origOpacity = 0.35; memb.userData.origTransparent = true; g.add(memb);
    g.add(mesh(new THREE.SphereGeometry(0.35, 20, 14), 0x9b59b6, 'nucleus'));
    g.add(mesh(new THREE.CapsuleGeometry(0.12, 0.25, 6, 12), 0xe67e22, 'mito', 0.45, 0.2, 0.2));
    return g;
  },
  house() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(1.6, 0.5, 1.2), 0xd35400, 'floor1', 0, -0.3, 0));
    g.add(mesh(new THREE.BoxGeometry(1.6, 0.5, 1.2), 0xf1c40f, 'floor2', 0, 0.3, 0));
    const roof = mesh(new THREE.ConeGeometry(1.2, 0.6, 4), 0x7f8c8d, 'roof', 0, 0.85, 0); roof.rotation.y = Math.PI / 4; g.add(roof);
    return g;
  },
  car() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(1.8, 0.4, 0.8), 0xc0392b, 'body', 0, 0.3, 0));
    g.add(mesh(new THREE.BoxGeometry(0.9, 0.3, 0.75), 0x2980b9, 'motor', -0.2, 0.65, 0));
    for (const [x, z] of [[-0.6, 0.45], [0.6, 0.45], [-0.6, -0.45], [0.6, -0.45]])
      g.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.15, 18), 0x2c3e50, 'wheel', x, 0, z));
    return g;
  },
  volcano() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.ConeGeometry(0.9, 1.2, 24, 1, true), 0x8d6e63, 'cone', 0, 0.1, 0));
    g.add(mesh(new THREE.SphereGeometry(0.35, 16, 12), 0xff5722, 'chamber', 0, -0.4, 0));
    g.add(mesh(new THREE.OctahedronGeometry(0.2), 0x4fc3f7, 'crystal', 1.1, 0.3, 0));
    return g;
  },
};
