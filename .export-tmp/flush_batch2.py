#!/usr/bin/env python3
"""Copy staged batch2 files into workspace."""
import json
import os
import shutil

WORKSPACE = "/workspace"
STAGING = "/workspace/.export-tmp/batch2-staging"
MANIFEST = "/workspace/.export-tmp/batch2-staging/manifest.json"

def main():
    if not os.path.isfile(MANIFEST):
        print(json.dumps({"error": "manifest missing"}))
        return
    data = json.load(open(MANIFEST))
    written = []
    failed = []
    for rel in data["paths"]:
        src = os.path.join(STAGING, os.path.basename(rel))
        dst = os.path.join(WORKSPACE, rel)
        try:
            if not os.path.isfile(src):
                raise FileNotFoundError(src)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)
            written.append(rel)
        except Exception as e:
            failed.append({"path": rel, "error": str(e)})
    print(json.dumps({"written": len(written), "failed": failed, "paths_written": written}))

if __name__ == "__main__":
    main()
