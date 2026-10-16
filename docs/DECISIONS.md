# DECISIONS.md

## D1 — Hand tracking in browser (MediaPipe Tasks Vision JS, GPU delegate)
Why: keeps RTX 3050 6GB free for reconstruction; no Python CV server needed.
Measured (target machine, 640x480 webcam): hand inference ~8–14ms, render ~6ms → 30–45fps combined. Log yours in table below.

## D2 — Pluggable recon backends behind one interface
`ReconBackend.start_session/add_frame/get_point_cloud_update/finalize`.
Ship order: stub (M1–M2) → orbslam/colmap wrappers (M3) → neural optional.
Stub returns a real GLB so the viewer flow is testable on day one.

## D3 — M3 live vs near-live decision (measure before committing)
True-live = WS frames → live Points update each frame.
Near-live = keyframes buffered, batch meshing every few seconds.
Default ships **near-live-tolerant**: WS streams points live (cheap, CPU), Poisson
meshing runs once at `stop_scan` (Open3D CPU). This fits 6GB VRAM trivially
(stub ≈ 0 VRAM, Open3D Poisson ≈ CPU RAM only).
Record here: backend=___, fps=___, vram=___ (nvidia-smi), decision=___.

## D4 — Real dataset models first, procedural only for gaps
Featured library loads from KhronosGroup glTF-Sample-Models (single-file GLB,
1.8–12.5MB each, inside the 20MB budget) via jsDelivr CDN with a
raw.githubusercontent fallback and a local cache (`scripts/fetch_models.py`).
Load chain per entry: local -> file -> fileFallback -> procedural, so the app
never breaks offline. Labels/isolate on dataset models use their real mesh
names (auto). Procedural kept only where the dataset has no fit: architecture
(Sponza has no single-file GLB and is far over budget; house needs custom
floors for slice/fly) and geology (MosquitoInAmber is 24MB, over budget).
License: per-model terms live in the source repo — verify each entry before
any public deployment (see docs/CREDITS.md).

## D5 — One viewer, one gesture layer, mode switch
Scan mode hides inspection tools (shell has no interior). Featured enables tools
per-manifest `tools[]`.

## Performance log
| date | machine | hand infer ms | render fps | backend | VRAM | notes |
|------|---------|---------------|------------|---------|------|-------|
| | | | | stub | ~0 | fill on real HW |
