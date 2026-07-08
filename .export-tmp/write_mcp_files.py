#!/usr/bin/env python3
"""Write batch1 files from JSON manifest: [{"path": "...", "content": "..."}]"""
import json
import os
import sys

WORKSPACE = "/workspace"

def main():
    manifest_path = sys.argv[1] if len(sys.argv) > 1 else "/tmp/batch1_manifest.json"
    with open(manifest_path, "r", encoding="utf-8") as f:
        items = json.load(f)
    written = []
    failed = []
    for item in items:
        path = item["path"]
        content = item["content"]
        try:
            full = os.path.join(WORKSPACE, path)
            os.makedirs(os.path.dirname(full), exist_ok=True)
            with open(full, "w", encoding="utf-8", newline="\n") as out:
                out.write(content)
                if content and not content.endswith("\n"):
                    out.write("\n")
            written.append(path)
            print(f"OK {path} ({len(content)} bytes)")
        except Exception as e:
            failed.append({"path": path, "error": str(e)})
            print(f"FAIL {path}: {e}", file=sys.stderr)
    print(json.dumps({"written": len(written), "failed": failed, "paths_written": written}))

if __name__ == "__main__":
    main()
