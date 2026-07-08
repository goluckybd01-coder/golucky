#!/usr/bin/env python3
"""
Continuous export helper: writes MCP-fetched content from JSONL input.
Each line: {"path": "rel/path", "content": "..."}

Usage:
  python3 continuous_export.py write-jsonl batch.jsonl
  python3 continuous_export.py status
"""
import json
import os
import sys

WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"


def write_file(rel: str, content: str) -> None:
    if not content:
        raise ValueError("empty content")
    head = content.lstrip()[:20]
    if rel.endswith(".tsx") and (head.startswith("@import") or head.startswith("@tailwind")):
        raise ValueError("corrupted tsx")
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")


def pending_src_count() -> int:
    data = json.load(open(PENDING, encoding="utf-8"))
    return len([p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))])


def cmd_write_jsonl(path: str) -> None:
    ok = fail = 0
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            try:
                write_file(obj["path"], obj["content"])
                print(f"OK {obj['path']} ({len(obj['content'])} bytes)")
                ok += 1
            except Exception as e:
                print(f"FAIL {obj['path']}: {e}", file=sys.stderr)
                fail += 1
    print(json.dumps({"written": ok, "failed": fail, "pending_src": pending_src_count()}))


def cmd_status() -> None:
    data = json.load(open(PENDING, encoding="utf-8"))
    ps = [p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))]
    print(json.dumps({"pending_src": len(ps), "first_10": ps[:10]}))


def main():
    if len(sys.argv) < 2:
        print("Usage: continuous_export.py [write-jsonl FILE|status]")
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == "write-jsonl":
        cmd_write_jsonl(sys.argv[2])
    elif cmd == "status":
        cmd_status()
    else:
        print(f"Unknown: {cmd}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
