#!/usr/bin/env python3
"""Write one Lovable file from stdin immediately. Usage: lovable_immediate_export.py REL_PATH"""
import json
import os
import sys

WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"


def write_file(rel: str, content: str) -> None:
    if not content or content.startswith("Lovable API error"):
        raise ValueError("invalid content")
    head = content.lstrip()[:20]
    if rel.endswith(".tsx") and (head.startswith("@import") or head.startswith("@tailwind")):
        raise ValueError("corrupted tsx")
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")


def pending_src() -> int:
    if not os.path.isfile(PENDING):
        return -1
    data = json.load(open(PENDING, encoding="utf-8"))
    return len([p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))])


def main():
    if len(sys.argv) != 2:
        print("Usage: lovable_immediate_export.py REL_PATH", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    write_file(rel, content)
    print(json.dumps({"ok": rel, "bytes": len(content), "pending_src": pending_src()}))


if __name__ == "__main__":
    main()
