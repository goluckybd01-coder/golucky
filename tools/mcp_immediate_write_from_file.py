#!/usr/bin/env python3
"""Write workspace file from content file: mcp_immediate_write_from_file.py REL_PATH CONTENT_FILE"""
import os
import sys

WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"


def main():
    if len(sys.argv) != 3:
        print("Usage: mcp_immediate_write_from_file.py REL_PATH CONTENT_FILE", file=sys.stderr)
        sys.exit(1)
    rel, src = sys.argv[1], sys.argv[2]
    with open(src, encoding="utf-8") as f:
        content = f.read()
    if not content or content.startswith("Lovable API error"):
        sys.exit(1)
    head = content.lstrip()[:20]
    if rel.endswith(".tsx") and (head.startswith("@import") or head.startswith("@tailwind")):
        sys.exit(1)
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")
    ps = -1
    if os.path.isfile(PENDING):
        import json
        data = json.load(open(PENDING, encoding="utf-8"))
        ps = len([p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))])
    print(f"OK {rel} ({len(content)} bytes) pending_src={ps}")


if __name__ == "__main__":
    main()
