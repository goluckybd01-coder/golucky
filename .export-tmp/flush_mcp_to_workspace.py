#!/usr/bin/env python3
"""Write staged MCP content files to workspace (skip existing)."""
import json
import os
import sys

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

def main():
    items = json.load(sys.stdin)
    written = skipped = failed = 0
    failures = []
    for rel, content in items.items():
        if not content or str(content).startswith("Lovable API error"):
            failed += 1
            failures.append(rel)
            continue
        r = write_file(rel, content)
        if r == "written":
            written += 1
        else:
            skipped += 1
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures}))

if __name__ == "__main__":
    main()
