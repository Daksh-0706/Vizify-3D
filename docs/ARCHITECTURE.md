# Architecture

```
Browser (Vite+TS, :5173)                     Python (FastAPI, :8000)
┌─ viewer.ts (Three.js, 1 scene)              ┌─ main.py (WS /ws/scan, HTTP /scan/*)
├─ tracker.ts (MediaPipe, 21 lm/hand)         ├─ backends/base.py (interface)
├─ filters.ts (EMA, hysteresis, debounce)     ├─ backends/stub.py (fake SLAM, real GLB)
├─ control.ts (clutch+gestures->camera)       ├─ backends/realtime.py (orbslam/colmap/neural wrappers)
├─ featured/ (manifest, procedural, gallery)  └─ meshing/ (cleanup, Poisson, GLB writer)
└─ scan/ (WS client, live THREE.Points)              storage/scans/*.glb
         │ WS JSON (SCAN_CONTRACT.md) │
         └────────────┬───────────────┘
```

Gesture pipeline: webcam frame -> landmarks -> EMA smooth -> hysteresis classify
-> debounce -> clutch gate -> rotate/zoom/pan/reset/point -> render.
Zoom uses XY hand distance only (MediaPipe z is relative/noisy).
