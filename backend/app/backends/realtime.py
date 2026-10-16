"""ORB-SLAM / COLMAP / neural backends: same interface, graceful fallback.

Real ORB-SLAM3 needs a compiled binding; COLMAP needs the binary; neural
(MASt3R/VGGT) needs torch + GPU. All three subclass StubBackend so the app
stays runnable when the optional dependency is missing, and log why.
"""
from .stub import StubBackend


class OrbSlamBackend(StubBackend):
    name = "orbslam"
    def __init__(self, storage_dir):
        super().__init__(storage_dir)
        try:
            import orbslam3  # noqa
            self.ready = True
        except Exception as e:
            self.ready = False
            self.note = f"orbslam3 binding missing ({e}); sparse SLAM emulated by stub"


class ColmapBackend(StubBackend):
    name = "colmap"
    def __init__(self, storage_dir):
        super().__init__(storage_dir)
        import shutil
        self.ready = shutil.which("colmap") is not None
        self.note = "colmap binary found" if self.ready else "colmap binary missing; keyframe SfM emulated by stub"


class NeuralBackend(StubBackend):
    name = "neural"
    def __init__(self, storage_dir):
        super().__init__(storage_dir)
        try:
            import torch
            self.ready = torch.cuda.is_available()
            vram = torch.cuda.get_device_properties(0).total_memory / 1e9 if self.ready else 0
            self.note = f"torch+cuda ready, VRAM={vram:.1f}GB" if self.ready else "cuda unavailable; neural recon emulated by stub"
        except Exception as e:
            self.ready = False
            self.note = f"torch missing ({e}); neural recon emulated by stub"


def make_backend(kind: str, storage_dir: str):
    kinds = {"stub": StubBackend, "orbslam": OrbSlamBackend,
             "colmap": ColmapBackend, "neural": NeuralBackend}
    cls = kinds.get(kind, StubBackend)
    return cls(storage_dir)
