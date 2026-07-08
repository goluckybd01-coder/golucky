#!/usr/bin/env python3
"""
Helper for agent-driven Lovable export.
Prints next N pending paths as JSON for agent to fetch via CallMcpTool.
After agent writes .export-tmp/incoming/<encoded>, run: flush_incoming.py

Also supports: status, corrupt list
"""
import json
import os
import sys

WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"
INCOMING = "/workspace/.export-tmp/incoming"


def enc(p: str) -> str:
    return p.replace("/", "__")


def pending_src(limit=25):
    data = json.load(open(PENDING, encoding="utf-8"))
    return [p for p in data["pending_src_paths"] if not os.path.isfile(os.path.join(WORKSPACE, p))][:limit]


def status():
    data = json.load(open(PENDING, encoding="utf-8"))
    missing = [p for p in data["pending_src_paths"] if not os.path.isfile(os.path.join(WORKSPACE, p))]
    incoming = len(os.listdir(INCOMING)) if os.path.isdir(INCOMING) else 0
    print(json.dumps({"pending_src": len(missing), "incoming": incoming}))


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "next":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 25
        print(json.dumps(pending_src(n)))
    elif cmd == "status":
        status()
    else:
        print("Usage: batch_mcp_export_agent.py [status|next N]")
        sys.exit(1)


if __name__ == "__main__":
    main()
