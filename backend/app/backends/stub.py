"""Stub backend: fake tracking + spiral point cloud, real GLB output.
Lets the scan->viewer flow be developed before real SLAM works."""
import math
import os
import numpy as np
from .base import ReconBackend


class StubBackend(ReconBackend):
    name = "stub"

    def __init__(self, storage_dir):
        self.storage_dir = storage_dir
        self.frames = 0
        self.scan_id = None
        self._points = []
        self._colors = []

    def start_session(self, scan_id, options):
        self.scan_id = scan_id
        self.frames = 0
        self._points, self._colors = [], []

    def add_frame(self, image_bytes, timestamp):
        self.frames += 1
        # spiral shell: deterministic fake coverage growing with frames
        n_new = 120
        for k in range(n_new):
            a = (self.frames * 0.35 + k * 0.21) % (2 * math.pi)
            b = (k / n_new) * math.pi
            r = 1.0 + 0.1 * math.sin(3 * a)
            x = r * math.sin(b) * math.cos(a)
            y = r * math.cos(b) * 0.8
            z = r * math.sin(b) * math.sin(a)
            self._points.append([x, y, z])
            s = 0.5 + 0.3 * (y + 1) / 2
            self._colors.append([s, s * 0.96, s * 0.9])
        start = max(0, len(self._points) - n_new * 4)
        return {
            "append_positions": self._points[start:],
            "append_colors": self._colors[start:],
            "frames": self.frames,
            "coverage": min(0.99, self.frames / 120.0),
        }

    def get_point_cloud_update(self):
        return {"positions": self._points, "colors": self._colors}

    def coverage(self):
        return min(0.99, self.frames / 120.0)

    def finalize(self):
        from ..meshing.mesh import mesh_from_points
        out = os.path.join(self.storage_dir, f"{self.scan_id}.glb")
        pts = np.array(self._points or [[0, 0, 0]], dtype=np.float64)
        col = np.array(self._colors or [[0.7, 0.7, 0.7]], dtype=np.float64)
        return mesh_from_points(pts if len(pts) > 100 else None, col, out)
