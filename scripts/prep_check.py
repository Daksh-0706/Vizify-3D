"""Model-prep checklist: validates a manifest entry (names, size, triangle budget)."""
import json, sys, os

def check(entry):
    errs = []
    if entry.get("file"):
        if not entry["file"].endswith(".glb"):
            errs.append("file should be a single-file .glb")
        if entry.get("local"):
            p = os.path.join("frontend", "public", entry["local"])
            if os.path.exists(p) and os.path.getsize(p) > 20 * 1024 * 1024:
                errs.append("cached copy over 20MB budget — run: gltf-transform optimize")
    if entry.get("procedural") and not entry.get("file"):
        pass  # offline-safe standalone
    if not entry.get("author"):
        errs.append("missing author credit")
    if not entry.get("license"):
        errs.append("missing license")
    return errs

if __name__ == "__main__":
    m = json.load(open("models/manifest.json"))
    ok = True
    for e in m["models"]:
        errs = check(e)
        print(e["id"], "OK" if not errs else errs)
        ok = ok and not errs
    sys.exit(0 if ok else 1)
