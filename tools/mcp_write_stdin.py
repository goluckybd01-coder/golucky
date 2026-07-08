#!/usr/bin/env python3
"""Write file from stdin: mcp_write_stdin.py REL_PATH"""
import json
import os
import sys

WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"


def main():
    if len(sys.argv) != 2:
        print("Usage: mcp_write_stdin.py REL_PATH", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    if not content or content.startswith("Lovable API error"):
        print(json.dumps({"error": "invalid content", "path": rel}), file=sys.stderr)
        sys.exit(1)
    head = content.lstrip()[:20]
    if rel.endswith(".tsx") and (head.startswith("@import") or head.startswith("@tailwind")):
        print(json.dumps({"error": "corrupted tsx", "path": rel}), file=sys.stderr)
        sys.exit(1)
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")
    ps = -1
    if os.path.isfile(PENDING):
        data = json.load(open(PENDING, encoding="utf-8"))
        ps = len([p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))])
    print(json.dumps({"ok": rel, "bytes": len(content), "pending_src": ps}))


if __name__ == "__main__":
    main()
