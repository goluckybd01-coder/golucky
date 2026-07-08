#!/usr/bin/env python3
"""
Fetch pending paths list and write from mcp_responses staging.
Agent: after each MCP read_file, save to STAGE/<path.replace('/','__')>
Then: python3 tools/export_runner.py flush
"""
import json
import os
import sys

sys.path.insert(0, "/workspace/tools")
from mcp_batch_export import write_file

STAGE = "/workspace/.export-tmp/mcp_responses"
WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"
PROJECT = "a96058c7-1b97-4e98-a71b-6b6121d46efa"


def pending_src(n=25):
    data = json.load(open(PENDING, encoding="utf-8"))
    return [p for p in data["pending_src_paths"] if not os.path.isfile(os.path.join(WORKSPACE, p))][:n]


def flush(force=False):
    ok = fail = 0
    os.makedirs(STAGE, exist_ok=True)
    for name in sorted(os.listdir(STAGE)):
        src = os.path.join(STAGE, name)
        if not os.path.isfile(src):
            continue
        rel = name.replace("__", "/")
        try:
            with open(src, encoding="utf-8") as f:
                content = f.read()
            if not force and os.path.isfile(os.path.join(WORKSPACE, rel)):
                sz = os.path.getsize(os.path.join(WORKSPACE, rel))
                if sz > 100:
                    os.remove(src)
                    continue
            write_file(rel, content)
            os.remove(src)
            print(f"OK {rel} ({len(content)} bytes)")
            ok += 1
        except Exception as e:
            print(f"FAIL {rel}: {e}", file=sys.stderr)
            fail += 1
    data = json.load(open(PENDING, encoding="utf-8"))
    ps = len([p for p in data["pending_src_paths"] if not os.path.isfile(os.path.join(WORKSPACE, p))])
    print(json.dumps({"written": ok, "failed": fail, "pending_src": ps}))


def stage(rel, content):
    os.makedirs(STAGE, exist_ok=True)
    enc = rel.replace("/", "__")
    with open(os.path.join(STAGE, enc), "w", encoding="utf-8") as f:
        f.write(content)
    write_file(rel, content)
    print(f"OK {rel} ({len(content)} bytes)")


def status():
    data = json.load(open(PENDING, encoding="utf-8"))
    ps = len([p for p in data["pending_src_paths"] if not os.path.isfile(os.path.join(WORKSPACE, p))])
    staged = len(os.listdir(STAGE)) if os.path.isdir(STAGE) else 0
    print(json.dumps({"pending_src": ps, "staged": staged, "project": PROJECT}))


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "next":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 25
        print(json.dumps(pending_src(n)))
    elif cmd == "flush":
        flush("--force" in sys.argv)
    elif cmd == "stage":
        content = sys.stdin.read()
        stage(sys.argv[2], content)
    elif cmd == "status":
        status()
    else:
        print("Usage: export_runner.py status|next N|stage PATH|flush [--force]")
        sys.exit(1)


if __name__ == "__main__":
    main()
