"""Minimal GLB writer (no heavy deps) for stub + fallback meshing."""
import json
import struct
import numpy as np


def write_glb(path, vertices, colors=None, faces=None, name="scan"):
    vertices = np.asarray(vertices, dtype=np.float32)
    n = len(vertices)
    if faces is None:
        # fan triangulation fallback (expects ordered ring); better callers pass faces
        faces = np.array([[0, i, i + 1] for i in range(1, n - 1)], dtype=np.uint32)
    faces = np.asarray(faces, dtype=np.uint32)
    if colors is None:
        colors = np.tile(np.array([0.7, 0.75, 0.8], dtype=np.float32), (n, 1))
    colors = np.asarray(colors, dtype=np.float32)
    if len(colors) != n:
        colors = np.tile(np.array([0.7, 0.75, 0.8], dtype=np.float32), (n, 1))

    vmin = vertices.min(axis=0).tolist()
    vmax = vertices.max(axis=0).tolist()
    fmin, fmax = int(faces.min()), int(faces.max())

    v_bytes = vertices.tobytes()
    c_bytes = colors.tobytes()
    i_bytes = faces.tobytes()

    # align each bufferView to 4 bytes
    def pad(b):
        return b + b"\x00" * ((-len(b)) % 4)

    v_bytes_p, c_bytes_p, i_bytes_p = pad(v_bytes), pad(c_bytes), pad(i_bytes)
    bin_blob = v_bytes_p + c_bytes_p + i_bytes_p
    off_v, off_c, off_i = 0, len(v_bytes_p), len(v_bytes_p) + len(c_bytes_p)

    gltf = {
        "asset": {"version": "2.0", "generator": "GestureView3D-stub"},
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": name}],
        "meshes": [{"name": name, "primitives": [{
            "attributes": {"POSITION": 0, "COLOR_0": 1},
            "indices": 2,
            "material": 0,
        }]}],
        "materials": [{"name": "scan_mat", "pbrMetallicRoughness": {
            "baseColorFactor": [1, 1, 1, 1], "metallicFactor": 0.0, "roughnessFactor": 0.9},
            "vertexColorSpace": "LINEAR"}],
        "buffers": [{"byteLength": len(bin_blob)}],
        "bufferViews": [
            {"buffer": 0, "byteOffset": off_v, "byteLength": len(v_bytes), "target": 34962},
            {"buffer": 0, "byteOffset": off_c, "byteLength": len(c_bytes), "target": 34962},
            {"buffer": 0, "byteOffset": off_i, "byteLength": len(i_bytes), "target": 34963},
        ],
        "accessors": [
            {"bufferView": 0, "componentType": 5126, "count": n, "type": "VEC3",
             "min": vmin, "max": vmax},
            {"bufferView": 1, "componentType": 5126, "count": n, "type": "VEC3"},
            {"bufferView": 2, "componentType": 5125, "count": int(faces.size), "type": "SCALAR",
             "min": [fmin], "max": [fmax]},
        ],
    }
    json_bytes = json.dumps(gltf, separators=(",", ":")).encode()
    json_bytes += b" " * ((-len(json_bytes)) % 4)
    total = 12 + 8 + len(json_bytes) + 8 + len(bin_blob)
    with open(path, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total))
        f.write(struct.pack("<II", len(json_bytes), 0x4E4F534A))
        f.write(json_bytes)
        f.write(struct.pack("<II", len(bin_blob), 0x004E4942))
        f.write(bin_blob)
    return path


def rock_mesh(n_points=1500, seed=7):
    """Deterministic bumpy 'scanned rock' mesh: icosphere-ish via lat/long grid."""
    rng = np.random.default_rng(seed)
    nu, nv = 40, 30
    us = np.linspace(0, 2 * np.pi, nu, endpoint=False)
    vs = np.linspace(0.05, np.pi - 0.05, nv)
    verts, cols, faces = [], [], []
    for j, v in enumerate(vs):
        for i, u in enumerate(us):
            r = 1.0 + 0.18 * np.sin(3 * u + seed) * np.cos(2 * v) + 0.07 * rng.standard_normal()
            x = r * np.sin(v) * np.cos(u)
            y = r * np.cos(v) * 0.8
            z = r * np.sin(v) * np.sin(u)
            verts.append([x, y, z])
            shade = 0.55 + 0.25 * (y + 1) / 2 + 0.05 * rng.standard_normal()
            cols.append([shade, shade * 0.97, shade * 0.92])
    for j in range(nv - 1):
        for i in range(nu):
            a = j * nu + i
            b = j * nu + (i + 1) % nu
            c = (j + 1) * nu + i
            d = (j + 1) * nu + (i + 1) % nu
            faces.append([a, c, b])
            faces.append([b, c, d])
    return np.array(verts, np.float32), np.array(cols, np.float32), np.array(faces, np.uint32)
