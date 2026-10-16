# Model credits
6 models load from the KhronosGroup glTF-Sample-Models dataset (free sample
assets, single-file GLB over CDN with local cache + procedural fallback).
2 are procedural (CC0). Part labels on dataset models come from their real
mesh names; curated labels only exist for the procedural two.

| model | source | author | license |
|---|---|---|---|
| Brain Stem | https://github.com/KhronosGroupArchives/glTF-Sample-Models/tree/main/2.0/BrainStem | KhronosGroup sample contributors | See source (verify before public deploy) |
| 2-Cylinder Engine | https://github.com/KhronosGroupArchives/glTF-Sample-Models/tree/main/2.0/2CylinderEngine | KhronosGroup sample contributors | See source (verify before public deploy) |
| Damaged Space Helmet | https://github.com/KhronosGroupArchives/glTF-Sample-Models/tree/main/2.0/DamagedHelmet | KhronosGroup sample contributors | See source (verify before public deploy) |
| BoomBox Teardown | https://github.com/KhronosGroupArchives/glTF-Sample-Models/tree/main/2.0/BoomBox | KhronosGroup sample contributors | See source (verify before public deploy) |
| Barramundi Fish | https://github.com/KhronosGroupArchives/glTF-Sample-Models/tree/main/2.0/BarramundiFish | KhronosGroup sample contributors | See source (verify before public deploy) |
| Toy Car | https://github.com/KhronosGroupArchives/glTF-Sample-Models/tree/main/2.0/ToyCar | KhronosGroup sample contributors | See source (verify before public deploy) |
| Section House | procedural (`frontend/src/featured/procedural.ts`) | GestureView 3D | CC0 |
| Volcano + Crystal | procedural (`frontend/src/featured/procedural.ts`) | GestureView 3D | CC0 |

Dataset gaps (kept procedural, see docs/DECISIONS.md D4): architecture needs
custom floor meshes for slice/fly tools (Sponza has no single-file GLB and is
far over budget); geology has no under-budget single-file GLB in the dataset
(MosquitoInAmber is 24MB, over budget).
Sizes: 1.8–12.5MB each, all inside the 20MB budget.
Offline copies: `python scripts/fetch_models.py` (gitignored, not committed).
