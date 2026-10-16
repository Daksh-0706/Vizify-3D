"""GestureView3D FastAPI backend. Contract per docs/SCAN_CONTRACT.md.

WS client->server: start_scan | frame | stop_scan
WS server->client: progress | points | mesh_ready | error
HTTP: POST /scan/upload, GET /scans, GET /scans/{id}.glb, GET /health
"""
import base64
import os
import time
import uuid
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .backends.realtime import make_backend

STORAGE = os.path.join(os.path.dirname(__file__), "..", "storage", "scans")
os.makedirs(STORAGE, exist_ok=True)
BACKEND_KIND = os.environ.get("RECON_BACKEND", "stub")

app = FastAPI(title="GestureView3D scan backend")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.get("/health")
def health():
    be = make_backend(BACKEND_KIND, STORAGE)
    return {"ok": True, "backend": be.name,
            "ready": getattr(be, "ready", True),
            "note": getattr(be, "note", "stub ready")}


@app.get("/scans")
def list_scans():
    out = []
    for f in sorted(os.listdir(STORAGE)):
        if f.endswith(".glb"):
            sid = f[:-4]
            out.append({"scan_id": sid, "url": f"/scans/{sid}.glb",
                        "size": os.path.getsize(os.path.join(STORAGE, f))})
    return out


@app.get("/scans/{scan_id}.glb")
def get_scan(scan_id: str):
    path = os.path.join(STORAGE, f"{scan_id}.glb")
    if not os.path.exists(path):
        return JSONResponse({"error": "not found"}, status_code=404)
    return FileResponse(path, media_type="model/gltf-binary")


@app.post("/scan/upload")
async def upload_scan(video: UploadFile = File(...)):
    """Near-live path: accept a recorded video, fake keyframe intake, return GLB."""
    scan_id = uuid.uuid4().hex[:8]
    be = make_backend(BACKEND_KIND, STORAGE)
    be.start_session(scan_id, {"mode": "near_live"})
    data = await video.read()
    # treat every ~50KB as a keyframe to keep it light
    n_frames = max(8, min(120, len(data) // 50000))
    for i in range(n_frames):
        upd = be.add_frame(b"", int(time.time() * 1000) + i)
    path = be.finalize()
    return {"scan_id": scan_id, "url": f"/scans/{scan_id}.glb",
            "frames": n_frames, "coverage": be.coverage()}


@app.websocket("/ws/scan")
async def ws_scan(ws: WebSocket):
    await ws.accept()
    scan_id = None
    be = None
    try:
        while True:
            msg = await ws.receive_json()
            t = msg.get("type")
            if t == "start_scan":
                scan_id = uuid.uuid4().hex[:8]
                opts = msg.get("options", {})
                be = make_backend(opts.get("backend", BACKEND_KIND), STORAGE)
                be.start_session(scan_id, opts)
                await ws.send_json({"type": "progress", "stage": "tracking",
                                    "frames": 0, "coverage": 0.0, "scan_id": scan_id})
            elif t == "frame":
                if be is None:
                    await ws.send_json({"type": "error", "message": "no session; send start_scan first"})
                    continue
                raw = base64.b64decode(msg.get("data", "") or "")
                upd = be.add_frame(raw, msg.get("t", 0))
                await ws.send_json({"type": "points",
                                    "positions": [c for p in upd["append_positions"] for c in p],
                                    "colors": [c for p in upd["append_colors"] for c in p],
                                    "append": True})
                # throttle progress: every 5 frames
                if upd["frames"] % 5 == 0:
                    await ws.send_json({"type": "progress", "stage": "tracking",
                                        "frames": upd["frames"], "coverage": upd["coverage"]})
            elif t == "stop_scan":
                if be is None:
                    await ws.send_json({"type": "error", "message": "no session"})
                    continue
                be.finalize()
                await ws.send_json({"type": "mesh_ready", "scan_id": scan_id,
                                    "url": f"/scans/{scan_id}.glb"})
                be = None
                scan_id = None
            else:
                await ws.send_json({"type": "error", "message": f"unknown type {t}"})
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await ws.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
