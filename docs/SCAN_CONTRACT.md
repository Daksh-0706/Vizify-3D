# SCAN CONTRACT (viewer <-> backend) — v1, frozen for M1

## WebSocket `ws://HOST:8000/ws/scan` (JSON messages)

Client -> Server:
- `{ "type": "start_scan", "options": { "resolution": 640, "mode": "live"|"near_live", "backend": "stub"|"orbslam"|"colmap"|"neural" } }`
- `{ "type": "frame", "t": 1234567, "data": "<base64 jpeg>" }` — 320px jpeg recommended, ~8fps
- `{ "type": "stop_scan" }`

Server -> Client:
- `{ "type": "progress", "stage": "tracking", "frames": 120, "coverage": 0.62, "scan_id": "abc123" }`
- `{ "type": "points", "positions": [x,y,z,...], "colors": [r,g,b,...], "append": true }` — append to THREE.Points
- `{ "type": "mesh_ready", "scan_id": "abc123", "url": "/scans/abc123.glb" }`
- `{ "type": "error", "message": "..." }`

## HTTP
- `GET /health` -> `{ ok, backend, ready, note }`
- `POST /scan/upload` (multipart `video`) -> `{ scan_id, url, frames, coverage }`
- `GET /scans` -> `[{ scan_id, url, size }]`
- `GET /scans/{id}.glb` -> GLB binary

## GLB output
Binary glTF 2.0, 1 mesh, POSITION + COLOR_0 + indices, <20MB. Viewer enables
`vertexColors` automatically when COLOR_0 present. Scanned models are surface
shells: viewer exposes only rotate/zoom/pan/reset (no isolate/xray/slice).
