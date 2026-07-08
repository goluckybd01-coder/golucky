#!/usr/bin/env python3
"""Write one file: python3 write_content_file.py REL_PATH < content.txt"""
import os
import sys

WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"


def main():
    if len(sys.argv) != 2:
        sys.exit("Usage: write_content_file.py REL_PATH")
    rel = sys.argv[1]
    content = sys.stdin.read()
    if not content or content.startswith("Lovable API error"):
        sys.exit(f"invalid content for {rel}")
    head = content.lstrip()[:20]
    if rel.endswith(".tsx") and (head.startswith("@import") or head.startswith("@tailwind")):
        sys.exit(f"corrupted tsx: {rel}")
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
