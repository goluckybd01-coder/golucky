#!/usr/bin/env python3
"""Flush .export-tmp/incoming/** to /workspace (overwrite)."""
import json
import os

WORKSPACE = "/workspace"
INCOMING = "/workspace/.export-tmp/incoming"

written = []
failed = []

for root, _, files in os.walk(INCOMING):
    for name in files:
        src = os.path.join(root, name)
        rel = os.path.relpath(src, INCOMING)
        try:
            with open(src, encoding="utf-8") as f:
                content = f.read()
            if not content or content.startswith("Lovable API error"):
                failed.append({"path": rel, "error": "empty or API error"})
                continue
            full = os.path.join(WORKSPACE, rel)
            os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
            with open(full, "w", encoding="utf-8", newline="\n") as f:
                f.write(content)
                if not content.endswith("\n"):
                    f.write("\n")
            written.append(rel)
        except Exception as e:
            failed.append({"path": rel, "error": str(e)})

print(json.dumps({"written": len(written), "failed": failed, "paths_written": written}))
