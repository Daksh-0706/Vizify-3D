"""Point-cloud cleanup + meshing. Uses Open3D Poisson when available,
else falls back to a deterministic procedural rock mesh (CPU, ~0 VRAM)."""
import os
import numpy as np

try:
    import open3d as o3d
    HAS_OPEN3D = True
except Exception:
    HAS_OPEN3D = False


def cleanup_points(points, colors=None):
    pts = np.asarray(points, dtype=np.float64)
    if len(pts) < 50:
        return pts, colors
    # statistical outlier removal (cheap numpy version when no open3d)
    if HAS_OPEN3D:
        pcd = o3d.geometry.PointCloud(o3d.utility.Vector3dVector(pts))
        if colors is not None:
            pcd.colors = o3d.utility.Vector3dVector(np.asarray(colors))
        pcd, _ = pcd.remove_statistical_outlier(nb_neighbors=20, std_ratio=2.0)
        c = np.asarray(pcd.colors) if pcd.has_colors() else None
        return np.asarray(pcd.points), c
    mean = pts.mean(axis=0)
    dist = np.linalg.norm(pts - mean, axis=1)
    keep = dist < (dist.mean() + 2.5 * dist.std())
    c = np.asarray(colors)[keep] if colors is not None else None
    return pts[keep], c


def mesh_from_points(points, colors=None, out_path="mesh.glb"):
    """Poisson when open3d exists, else rock_mesh fallback. Always returns path."""
    from .glb import write_glb, rock_mesh
    pts = np.asarray(points, dtype=np.float64) if points is not None else None
    if HAS_OPEN3D and pts is not None and len(pts) >= 100:
        try:
            pcd = o3d.geometry.PointCloud(o3d.utility.Vector3dVector(pts))
            if colors is not None:
                pcd.colors = o3d.utility.Vector3dVector(np.asarray(colors, dtype=np.float64))
            else:
                pcd.paint_uniform_color([0.7, 0.72, 0.75])
            pcd.estimate_normals()
            mesh, _ = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(pcd, depth=8)
            mesh.remove_degenerate_triangles()
            v = np.asarray(mesh.vertices, dtype=np.float32)
            t = np.asarray(mesh.triangles, dtype=np.uint32)
            vc = np.asarray(mesh.vertex_colors, dtype=np.float32)
            if len(vc) != len(v):
                vc = None
            # decimate to <=200k tris budget
            if len(t) > 120000:
                mesh = mesh.simplify_quadric_decimation(60000)
                v = np.asarray(mesh.vertices, dtype=np.float32)
                t = np.asarray(mesh.triangles, dtype=np.uint32)
                vc = None
            return write_glb(out_path, v, vc, t, name="scan_poisson")
        except Exception as e:
            print("Poisson failed, fallback:", e)
    v, c, f = rock_mesh()
    return write_glb(out_path, v, c, f, name="scan_stub")
