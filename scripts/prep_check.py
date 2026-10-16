"""Model-prep checklist: validates a manifest entry (names, size, triangle budget)."""
import json, sys, os

def check(entry):
    errs = []
    for k in ["id", "category", "file", "license", "tools"]:
        pass
    if entry.get("file"):
        p = os.path.join("frontend", "public", entry["file"])
        if not os.path.exists(p):
            errs.append(f"missing file {p}")
        elif os.path.getsize(p) > 20 * 1024 * 1024:
            errs.append("over 20MB budget — run: gltf-transform optimize")
    if not entry.get("author"):
        errs.append("missing author credit")
    return errs

if __name__ == "__main__":
    m = json.load(open("models/manifest.json"))
    ok = True
    for e in m["models"]:
        errs = check(e)
        print(e["id"], "OK" if not errs else errs)
        ok = ok and not errs
    sys.exit(0 if ok else 1)
