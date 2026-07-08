#!/usr/bin/env python3
"""Write root config files from batch JSON."""
import json, os, sys
WORKSPACE = "/workspace"
data = json.load(open("/workspace/.export-tmp/batches/root_configs.json"))
for path, content in data.items():
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    print(f"Wrote {path}")
