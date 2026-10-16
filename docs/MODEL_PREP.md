# Model preparation checklist
1. Open in Blender/glTF viewer — confirm separate NAMED meshes per part.
2. Normalize: scale longest side to ~2 units, pivot at center.
3. Rename parts to readable snake_case; group into layers if needed.
4. Compress: `gltf-transform optimize in.glb frontend/public/models/x.glb` (target <10–20MB, <200k tris).
5. Manifest entry: id/category/title/file/author/license/source/tools/parts/explode.
6. Validate: `python scripts/prep_check.py`.
7. Test: isolate + explode + slice + labels in viewer.

Sources (verify CC0/CC-BY, credit author+URL in manifest):
Anatomy: BodyParts3D, NIH 3D · Machines/vehicles: Sketchfab "exploded", GrabCAD, Thingiverse (STL→GLB) · Space: NASA 3D + procedural · Bio/chem: NIH 3D, PDB · Arch: Sketchfab, Poly Pizza, Blender builds.
