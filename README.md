# GestureView 3D (Vizify-3D)

Hands-free 3D viewer: control models entirely with webcam hand gestures. Two modes, one app.

- **Featured mode**: 6 real dataset models (KhronosGroup glTF-Sample-Models: brain stem, 2-cylinder engine, helmet, boombox, fish, toy car) + 2 procedural (section house, volcano) with explode, x-ray, cross-section, part isolation, labels, fly-inside — driven by `models/manifest.json` (no code change to add a model).
- **Scan mode**: FastAPI backend (WS live frames + HTTP video upload) → live point cloud → Poisson/fallback meshing → GLB auto-loads in the same viewer. External controls only (shell has no interior).

## Quickstart
```bash
# backend (Python 3.10+)
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
# frontend (Node 18+, new terminal)
cd frontend && npm install && npm run dev   # http://localhost:5173
```
Backend health: http://localhost:8000/health · scans: `backend/storage/scans/`.

## Gestures (webcam)
Thumbs-up = clutch on/off · 1-hand pinch-drag = rotate · 2-hand pinch spread = zoom · open palm = pan · fist = reset · point = part label. Mouse/OrbitControls always works. Target 30+ fps (see header readout).

## Tests
```bash
pytest backend/tests -q        # GLB writer + stub backend + contract
cd frontend && npm test        # gesture logic (hysteresis, smoothing, pinch)
python scripts/prep_check.py   # manifest validation
python scripts/generate_sample_glb.py  # sample GLB
```

## Config
`RECON_BACKEND=stub|orbslam|colmap|neural` (default stub; others gracefully emulate until optional deps exist). Frontend proxies `/scans /scan /health` → `:8000` in dev.

## Docs
`docs/SCAN_CONTRACT.md` (frozen M1 interface) · `docs/DECISIONS.md` (incl. M3 live-vs-near-live + perf log) · `docs/ARCHITECTURE.md` · `docs/MODEL_PREP.md` · `docs/CREDITS.md` · `docs/DEMO_SCRIPT.md`.

## Known limitations
- Bundled models are procedural stand-ins; swap in CC0 GLBs per MODEL_PREP.md for production richness.
- Stub SLAM fakes tracking (spiral shell); real ORB-SLAM3/COLMAP/VGGT need optional binaries + 6GB tuning (fp16, ≤640px, keyframes).
- Cross-section is single-plane clip (stencil caps = future work); x-ray is opacity-based.
- MediaPipe model loads from CDN (needs internet first run).
