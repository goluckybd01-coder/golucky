#!/usr/bin/env python3
"""Flush /workspace/.export-tmp/staging/** to /workspace."""
import json
import os

STAGING = "/workspace/.export-tmp/staging"
WORKSPACE = "/workspace"
written = []
failed = []
for root, _, files in os.walk(STAGING):
    for name in files:
        src = os.path.join(root, name)
        rel = os.path.relpath(src, STAGING)
        try:
            with open(src, encoding="utf-8") as f:
                content = f.read()
            if not content or content.startswith("Lovable API error"):
                failed.append({"path": rel, "error": "empty"})
                continue
            dest = os.path.join(WORKSPACE, rel)
            os.makedirs(os.path.dirname(dest) or WORKSPACE, exist_ok=True)
            with open(dest, "w", encoding="utf-8", newline="\n") as f:
                f.write(content)
                if not content.endswith("\n"):
                    f.write("\n")
            written.append(rel)
        except Exception as e:
            failed.append({"path": rel, "error": str(e)})
print(json.dumps({"written": len(written), "failed": failed, "paths_written": sorted(written)}))
