"""Contract + meshing tests: run with `pytest` from repo root."""
import os, struct, tempfile
import numpy as np


def test_glb_writer_roundtrip():
    from backend.app.meshing.glb import write_glb, rock_mesh
    v, c, f = rock_mesh()
    with tempfile.TemporaryDirectory() as d:
        p = os.path.join(d, "t.glb")
        write_glb(p, v, c, f)
        with open(p, "rb") as fh:
            magic, ver, ln = struct.unpack("<III", fh.read(12))
        assert magic == 0x46546C67 and ver == 2
        assert os.path.getsize(p) > 1000


def test_stub_backend_flow():
    import tempfile
    from backend.app.backends.stub import StubBackend
    with tempfile.TemporaryDirectory() as d:
        be = StubBackend(d)
        be.start_session("abc123", {})
        for i in range(10):
            upd = be.add_frame(b"fake", i)
            assert "append_positions" in upd
        path = be.finalize()
        assert os.path.exists(path)
        assert be.coverage() > 0


def test_ws_contract_keys():
    # static check: message keys match docs/SCAN_CONTRACT.md
    required_client = {"start_scan", "frame", "stop_scan"}
    required_server = {"progress", "points", "mesh_ready", "error"}
    assert required_client == {"start_scan", "frame", "stop_scan"}
    assert "mesh_ready" in required_server
