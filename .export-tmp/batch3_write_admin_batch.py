#!/usr/bin/env python3
"""Write admin batch files fetched via MCP (skip existing)."""
import json
import os

WORKSPACE = "/workspace"

def write_file(rel, content):
    full = os.path.join(WORKSPACE, rel)
    if os.path.isfile(full):
        return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"

# Content loaded from Lovable MCP read_file
FILES = {}

if __name__ == "__main__":
    w = s = 0
    for path, content in FILES.items():
        r = write_file(path, content)
        if r == "written":
            w += 1
        else:
            s += 1
    print(json.dumps({"written": w, "skipped": s, "total": len(FILES)}))
