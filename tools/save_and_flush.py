#!/usr/bin/env python3
"""
Automated export loop helper for agent-driven Lovable MCP export.
Agent workflow per batch:
  1. python3 tools/export_runner.py next 25  -> paths
  2. CallMcpTool read_file for each path
  3. IMMEDIATELY: python3 tools/save_incoming.py PATH < content  OR cp agent-tools file
  4. python3 tools/flush_incoming.py
  5. python3 tools/build_export_queue.py && python3 tools/export_runner.py status

This script: save stdin content to incoming + flush in one step.
Usage: save_and_flush.py REL_PATH < content
"""
import os
import sys

sys.path.insert(0, "/workspace/tools")
from mcp_batch_export import write_file

INCOMING = "/workspace/.export-tmp/incoming"
PENDING = "/workspace/.export-tmp/pending_all.json"
WORKSPACE = "/workspace"


def pending_src():
    if not os.path.isfile(PENDING):
        return -1
    import json
    data = json.load(open(PENDING, encoding="utf-8"))
    return len([p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))])


def main():
    if len(sys.argv) != 2:
        print("Usage: save_and_flush.py REL_PATH < content", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    write_file(rel, content)
    print(f"OK {rel} ({len(content)} bytes)")
    print(f'{{"pending_src": {pending_src()}}}')


if __name__ == "__main__":
    main()
