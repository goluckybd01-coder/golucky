#!/usr/bin/env python3
"""
Automated Lovable export via CallMcpTool companion script.
Reads path list, prints instructions, writes from .export-tmp/incoming/.

Usage:
  python3 mcp_export_batch.py next 25     # print next 25 paths as JSON
  python3 mcp_export_batch.py flush       # write all incoming files
  python3 mcp_export_batch.py write PATH CONTENT_FILE  # write one file
  python3 mcp_export_batch.py status
"""
import json
import os
import sys

sys.path.insert(0, "/workspace/tools")
from mcp_batch_export import write_file

WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"
INCOMING = "/workspace/.export-tmp/incoming"
PROJECT = "a96058c7-1b97-4e98-a71b-6b6121d46efa"


def pending_src(limit=25):
    data = json.load(open(PENDING, encoding="utf-8"))
    return [p for p in data["pending_src_paths"] if not os.path.isfile(os.path.join(WORKSPACE, p))][:limit]


def pending_count():
    data = json.load(open(PENDING, encoding="utf-8"))
    return len([p for p in data["pending_src_paths"] if not os.path.isfile(os.path.join(WORKSPACE, p))])


def flush():
    ok = fail = 0
    os.makedirs(INCOMING, exist_ok=True)
    for name in sorted(os.listdir(INCOMING)):
        src = os.path.join(INCOMING, name)
        if not os.path.isfile(src):
            continue
        rel = name.replace("__", "/")
        try:
            with open(src, encoding="utf-8") as f:
                content = f.read()
            write_file(rel, content)
            os.remove(src)
            print(f"OK {rel} ({len(content)} bytes)")
            ok += 1
        except Exception as e:
            print(f"FAIL {rel}: {e}", file=sys.stderr)
            fail += 1
    print(json.dumps({"written": ok, "failed": fail, "pending_src": pending_count()}))


def write_one(rel, content_file):
    with open(content_file, encoding="utf-8") as f:
        content = f.read()
    write_file(rel, content)
    print(json.dumps({"ok": rel, "bytes": len(content), "pending_src": pending_count()}))


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "next":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 25
        print(json.dumps({"project": PROJECT, "paths": pending_src(n)}))
    elif cmd == "flush":
        flush()
    elif cmd == "write":
        write_one(sys.argv[2], sys.argv[3])
    elif cmd == "status":
        print(json.dumps({"pending_src": pending_count(), "project": PROJECT}))
    else:
        print("Usage: mcp_export_batch.py status|next N|flush|write PATH CONTENT_FILE")
        sys.exit(1)


if __name__ == "__main__":
    main()
