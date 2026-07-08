#!/usr/bin/env python3
"""
Process MCP export batch: write all files from .export-tmp/incoming/ then report status.
Agent workflow per batch of 25:
  1. CallMcpTool read_file for each path
  2. Immediately: save content to .export-tmp/incoming/<path.replace('/','__')>
  3. Run: python3 tools/process_incoming_batch.py
"""
import json
import os
import sys

sys.path.insert(0, "/workspace/tools")
from mcp_batch_export import write_file

INCOMING = "/workspace/.export-tmp/incoming"
WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"


def pending_src():
    data = json.load(open(PENDING, encoding="utf-8"))
    return len([p for p in data["pending_src_paths"] if not os.path.isfile(os.path.join(WORKSPACE, p))])


def main():
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
    print(json.dumps({"written": ok, "failed": fail, "pending_src": pending_src()}))


if __name__ == "__main__":
    main()
