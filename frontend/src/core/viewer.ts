import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// three r170 ships without bundled types for examples; silence implicit-any on traversals
type AnyObj = THREE.Object3D & { isMesh?: boolean; material?: any; name: string };

export class Viewer {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  root = new THREE.Group();
  private clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 10);
  private sliceEnabled = false;
  private home = { pos: new THREE.Vector3(0, 0.6, 3.4), tgt: new THREE.Vector3(0, 0, 0) };

  constructor(el: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(el.clientWidth || 800, el.clientHeight || 600);
    this.renderer.localClippingEnabled = true;
    el.appendChild(this.renderer.domElement);
    this.scene.background = new THREE.Color(0x0b0e13);
    this.camera = new THREE.PerspectiveCamera(50, 4 / 3, 0.01, 100);
    this.camera.position.copy(this.home.pos);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(this.home.tgt);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1.2));
    const d = new THREE.DirectionalLight(0xffffff, 1.6);
    d.position.set(2, 4, 3); this.scene.add(d);
    this.scene.add(this.root);
    const grid = new THREE.GridHelper(6, 12, 0x334455, 0x1a2230);
    grid.position.y = -1.2; this.scene.add(grid);
    new ResizeObserver(() => {
      const w = el.clientWidth || 800, h = el.clientHeight || 600;
      this.renderer.setSize(w, h); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    }).observe(el);
    const loop = () => { this.controls.update(); this.renderer.render(this.scene, this.camera); requestAnimationFrame(loop); };
    loop();
    addEventListener('resize', () => this.renderer.render(this.scene, this.camera));
  }

  clear() {
    this.root.traverse(o => {
      const m = o as THREE.Mesh;
      if (m.isMesh) { m.geometry.dispose(); }
    });
    this.root.clear();
    this.root.position.set(0, 0, 0); this.root.rotation.set(0, 0, 0); this.root.scale.setScalar(1);
  }

  frameObject() {
    const box = new THREE.Box3().setFromObject(this.root);
    if (box.isEmpty()) return;
    const c = box.getCenter(new THREE.Vector3());
    const s = box.getSize(new THREE.Vector3()).length();
    this.controls.target.copy(c);
    this.camera.position.copy(c).add(new THREE.Vector3(s * 0.5, s * 0.35, s * 0.9));
    this.home = { pos: this.camera.position.clone(), tgt: c.clone() };
  }

  async loadGLB(url: string) {
    this.clear();
    const gltf = await new GLTFLoader().loadAsync(url);
    this.root.add(gltf.scene);
    this.normalize();
    this.frameObject();
  }

  loadGroup(g: THREE.Group) { this.clear(); this.root.add(g); this.normalize(); this.frameObject(); }

  private normalize() {
    const box = new THREE.Box3().setFromObject(this.root);
    if (box.isEmpty()) return;
    const s = box.getSize(new THREE.Vector3()).length() || 1;
    const k = 2.4 / s;
    const inner = new THREE.Group();
    // move children into normalized wrapper without losing names
    while (this.root.children.length) inner.add(this.root.children[0]);
    inner.scale.setScalar(k);
    const c = box.getCenter(new THREE.Vector3()).multiplyScalar(k);
    inner.position.sub(c);
    this.root.add(inner);
  }

  reset() {
    this.camera.position.copy(this.home.pos); this.controls.target.copy(this.home.tgt);
    this.root.rotation.set(0, 0, 0); this.root.scale.setScalar(1);
    const p = this.root.position; void p;
  }

  // ---- inspection tools ----
  setExplode(amount: number, strength = 1) {
    const center = new THREE.Box3().setFromObject(this.root).getCenter(new THREE.Vector3());
    this.root.traverse(o => {
      if (!(o as THREE.Mesh).isMesh) return;
      const m = o as THREE.Mesh;
      if (!m.userData.basePos) m.userData.basePos = m.position.clone();
      if (!m.userData.dir) {
        const c = new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3());
        const d = c.sub(center);
        m.userData.dir = d.lengthSq() > 1e-8 ? d.normalize() : new THREE.Vector3(0, 1, 0);
      }
      m.position.copy(m.userData.basePos).addScaledVector(m.userData.dir, amount * strength);
    });
  }
  setXray(on: boolean) {
    this.root.traverse(o => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mat = m.material as THREE.MeshStandardMaterial;
      if (!mat || !('transparent' in mat)) return;
      mat.transparent = on ? true : (m.userData.origTransparent ?? false);
      mat.opacity = on ? 0.25 : (m.userData.origOpacity ?? 1);
      mat.depthWrite = on ? false : true;
      mat.needsUpdate = true;
    });
  }
  setSlice(x: number, enabled: boolean) {
    this.sliceEnabled = enabled;
    this.clipPlane.constant = x;
    this.renderer.clippingPlanes = enabled ? [this.clipPlane] : [];
  }
  isolate(name: string) {
    this.root.traverse(o => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.visible = !name || m.name === name || m.name.startsWith(name);
    });
  }
  partNames(): string[] {
    const out: string[] = [];
    this.root.traverse(o => { if ((o as THREE.Mesh).isMesh && o.name) out.push(o.name); });
    return [...new Set(out)];
  }
}
