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

## D4 — Procedural featured models first
Why: guaranteed named parts, zero license risk, offline runnable, <200k tris.
Real CC0 GLBs (BodyParts3D, NIH 3D, NASA) can replace any manifest entry via
`file:` with no code change. See MODEL_PREP.md.

## D5 — One viewer, one gesture layer, mode switch
Scan mode hides inspection tools (shell has no interior). Featured enables tools
per-manifest `tools[]`.

## Performance log
| date | machine | hand infer ms | render fps | backend | VRAM | notes |
|------|---------|---------------|------------|---------|------|-------|
| | | | | stub | ~0 | fill on real HW |
