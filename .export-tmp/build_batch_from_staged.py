#!/usr/bin/env python3
"""Build batch JSON from staged .content files listed in manifest."""
import json, os, sys

READS = "/workspace/.export-tmp/reads"
WORKSPACE = "/workspace"

def safe_name(path):
    return path.replace("/", "__")

def main():
    manifest = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else "/workspace/.export-tmp/batch_current.json"
    items = []
    with open(manifest) as f:
        for path in (ln.strip() for ln in f if ln.strip()):
            cf = os.path.join(READS, safe_name(path) + ".content")
            if not os.path.exists(cf):
                items.append({"path": path, "error": "missing staged content"})
                continue
            with open(cf, encoding="utf-8") as f:
                items.append({"path": path, "content": f.read()})
    with open(out, "w", encoding="utf-8") as f:
        json.dump(items, f)
    print(json.dumps({"items": len(items), "out": out}))

if __name__ == "__main__":
    main()
