"""Generate a sample multi-part scan-style GLB into frontend/public/models/."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
from app.meshing.glb import write_glb, rock_mesh  # noqa

out = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "models", "sample-scan.glb")
os.makedirs(os.path.dirname(out), exist_ok=True)
v, c, f = rock_mesh()
write_glb(out, v, c, f, name="sample-scan")
print("wrote", out, os.path.getsize(out), "bytes")
