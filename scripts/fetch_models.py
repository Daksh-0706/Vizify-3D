"""Fetch dataset GLBs into frontend/public/models/ for offline use.

Reads models/manifest.json, downloads each `file` (falls back to
`fileFallback`), verifies the glTF magic bytes + 20MB size budget,
and saves to `local`. Binaries are gitignored; the app works online
without them (CDN) and offline with them.
"""
import json
import os
import sys
import urllib.request

ROOT = os.path.join(os.path.dirname(__file__), "..")
MANIFEST = os.path.join(ROOT, "models", "manifest.json")
BUDGET = 20 * 1024 * 1024


def fetch(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": "gestureview"})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = r.read()
    if data[:4] != b"glTF":
        raise ValueError(f"not a GLB (magic={data[:4]!r})")
    if len(data) > BUDGET:
        raise ValueError(f"over 20MB budget ({len(data)} bytes)")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "wb") as f:
        f.write(data)
    return len(data)


def main():
    m = json.load(open(MANIFEST))
    ok = True
    for e in m["models"]:
        if not e.get("file"):
            print(f"{e['id']}: procedural, skip")
            continue
        dest = os.path.join(ROOT, "frontend", "public", e["local"])
        if os.path.exists(dest) and open(dest, "rb").read(4) == b"glTF":
            print(f"{e['id']}: cached ({os.path.getsize(dest)} bytes)")
            continue
        for url in [e["file"], e.get("fileFallback")]:
            if not url:
                continue
            try:
                n = fetch(url, dest)
                print(f"{e['id']}: downloaded {n} bytes from {url[:60]}...")
                break
            except Exception as ex:
                print(f"{e['id']}: {url[:60]}... FAILED ({ex})")
        else:
            print(f"{e['id']}: all sources failed (app falls back to procedural)")
            ok = False
    print("REMINDER: verify each model's author/license at its `source` URL before public deploy.")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
