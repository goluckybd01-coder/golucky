#!/usr/bin/env python3
"""Copy source files from mapping JSON to /workspace paths."""
import json
import os
import sys

WORKSPACE = "/workspace"

def main():
    manifest = sys.argv[1] if len(sys.argv) > 1 else "/workspace/.export-tmp/batch3_manifest.json"
    with open(manifest, encoding="utf-8") as f:
        items = json.load(f)
    written = []
    failed = []
    for item in items:
        rel = item["path"]
        src = item["src"]
        try:
            with open(src, encoding="utf-8") as f:
                content = f.read()
            if not content or content.startswith("Lovable API error"):
                failed.append({"path": rel, "error": "empty or API error"})
                continue
            full = os.path.join(WORKSPACE, rel)
            os.makedirs(os.path.dirname(full), exist_ok=True)
            with open(full, "w", encoding="utf-8", newline="\n") as f:
                f.write(content)
                if not content.endswith("\n"):
                    f.write("\n")
            written.append(rel)
        except Exception as e:
            failed.append({"path": rel, "error": str(e)})
    print(json.dumps({"written": len(written), "failed": failed, "paths_written": written}))

if __name__ == "__main__":
    main()
