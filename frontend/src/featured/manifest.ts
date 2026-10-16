export interface PartInfo { label: string; info: string; layer?: string }
export interface ManifestEntry {
  id: string; category: string; title: string;
  /** Local cached copy (created by scripts/fetch_models.py). Tried first. */
  local?: string;
  /** Remote dataset URL (CDN). Tried second. */
  file?: string;
  /** Fallback host for the same file. Tried third. */
  fileFallback?: string;
  /** Procedural builder key. Final fallback / standalone. */
  procedural?: string;
  author: string; license: string; source: string;
  tools: string[];          // isolate,xray,slice,labels,explode,fly
  /** Curated labels. Empty => auto-generated from real mesh names at load. */
  parts: Record<string, PartInfo>;
  explode: { mode: string; strength: number };
}

const CDN = 'https://cdn.jsdelivr.net/gh/KhronosGroupArchives/glTF-Sample-Models@main/2.0';
const RAW = 'https://raw.githubusercontent.com/KhronosGroupArchives/glTF-Sample-Models/main/2.0';
const SRC = 'https://github.com/KhronosGroupArchives/glTF-Sample-Models/tree/main/2.0';
const KH = 'KhronosGroup glTF-Sample-Models contributors';
// Per-model original authors/licenses live in the source repo folders.
// Verify each entry's license before any public deployment (see docs/CREDITS.md).
const LIC = 'See source repo (verify before public deploy)';

export const MANIFEST: ManifestEntry[] = [
  { id: 'brainstem', category: 'anatomy', title: 'Brain Stem', local: 'models/brainstem.glb',
    file: `${CDN}/BrainStem/glTF-Binary/BrainStem.glb`, fileFallback: `${RAW}/BrainStem/glTF-Binary/BrainStem.glb`,
    author: KH, license: LIC, source: `${SRC}/BrainStem`,
    tools: ['isolate', 'xray', 'slice', 'labels', 'explode', 'fly'], parts: {},
    explode: { mode: 'radial', strength: 1.0 } },
  { id: 'engine', category: 'machines', title: '2-Cylinder Engine', local: 'models/engine.glb',
    file: `${CDN}/2CylinderEngine/glTF-Binary/2CylinderEngine.glb`, fileFallback: `${RAW}/2CylinderEngine/glTF-Binary/2CylinderEngine.glb`,
    author: KH, license: LIC, source: `${SRC}/2CylinderEngine`,
    tools: ['isolate', 'xray', 'slice', 'labels', 'explode'], parts: {},
    explode: { mode: 'radial', strength: 1.4 } },
  { id: 'helmet', category: 'space', title: 'Damaged Space Helmet', local: 'models/helmet.glb',
    file: `${CDN}/DamagedHelmet/glTF-Binary/DamagedHelmet.glb`, fileFallback: `${RAW}/DamagedHelmet/glTF-Binary/DamagedHelmet.glb`,
    author: KH, license: LIC, source: `${SRC}/DamagedHelmet`,
    tools: ['isolate', 'xray', 'slice', 'labels', 'explode'], parts: {},
    explode: { mode: 'radial', strength: 1.2 } },
  { id: 'boombox', category: 'electronics', title: 'BoomBox Teardown', local: 'models/boombox.glb',
    file: `${CDN}/BoomBox/glTF-Binary/BoomBox.glb`, fileFallback: `${RAW}/BoomBox/glTF-Binary/BoomBox.glb`,
    author: KH, license: LIC, source: `${SRC}/BoomBox`,
    tools: ['isolate', 'xray', 'slice', 'labels', 'explode'], parts: {},
    explode: { mode: 'radial', strength: 1.6 } },
  { id: 'fish', category: 'biology', title: 'Barramundi Fish', local: 'models/fish.glb',
    file: `${RAW}/BarramundiFish/glTF-Binary/BarramundiFish.glb`, fileFallback: `${CDN}/BarramundiFish/glTF-Binary/BarramundiFish.glb`,
    author: KH, license: LIC, source: `${SRC}/BarramundiFish`,
    tools: ['isolate', 'xray', 'slice', 'labels', 'explode'], parts: {},
    explode: { mode: 'radial', strength: 1.2 } },
  { id: 'house', category: 'architecture', title: 'Section House', procedural: 'house',
    author: 'GestureView procedural (CC0)', license: 'CC0', source: '',
    tools: ['isolate', 'slice', 'labels', 'explode', 'fly'],
    parts: {
      roof: { label: 'Roof', info: 'Removable for plan view.' },
      floor1: { label: 'Floor 1', info: 'Living spaces.' },
      floor2: { label: 'Floor 2', info: 'Bedrooms.' },
    },
    explode: { mode: 'radial', strength: 1.5 } },
  { id: 'toycar', category: 'vehicles', title: 'Toy Car', local: 'models/toycar.glb',
    file: `${CDN}/ToyCar/glTF-Binary/ToyCar.glb`, fileFallback: `${RAW}/ToyCar/glTF-Binary/ToyCar.glb`,
    author: KH, license: LIC, source: `${SRC}/ToyCar`,
    tools: ['isolate', 'xray', 'labels', 'explode'], parts: {},
    explode: { mode: 'radial', strength: 1.5 } },
  { id: 'volcano', category: 'geology', title: 'Volcano + Crystal', procedural: 'volcano',
    author: 'GestureView procedural (CC0)', license: 'CC0', source: '',
    tools: ['isolate', 'slice', 'xray', 'labels', 'explode'],
    parts: {
      cone: { label: 'Cone', info: 'Stratified ash + lava.' },
      chamber: { label: 'Magma chamber', info: 'Molten reservoir.' },
      crystal: { label: 'Crystal', info: 'Ordered lattice.' },
    },
    explode: { mode: 'radial', strength: 1.3 } },
];

/** Turn a raw mesh/node name ("Object_12", "material_3") into a readable label. */
export function prettyName(n: string): string {
  return n.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim() || 'part';
}
