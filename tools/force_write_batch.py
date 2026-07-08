#!/usr/bin/env python3
"""Force-write batch JSON {path: content} to workspace, always overwriting."""
import json
import os
import sys

WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"


def write_file(rel: str, content: str) -> None:
    if not content or str(content).startswith("Lovable API error"):
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
    if len(sys.argv) < 2:
        print("Usage: force_write_batch.py <json-file>", file=sys.stderr)
        sys.exit(1)
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    ok = fail = 0
    for path, content in data.items():
        try:
            write_file(path, content)
            print(f"OK {path} ({len(content)} bytes)")
            ok += 1
        except Exception as e:
            print(f"FAIL {path}: {e}", file=sys.stderr)
            fail += 1
    print(json.dumps({"written": ok, "failed": fail, "pending_src": pending_src()}))


if __name__ == "__main__":
    main()
