#!/usr/bin/env python3
"""
Agent-driven export: fetch paths via Lovable MCP (CallMcpTool only from agent),
write immediately via staging files.

Agent workflow per batch:
1. python3 export_loop_runner.py next 25  -> get paths
2. For each path: CallMcpTool read_file -> write to STAGE/<enc(path)>
3. python3 lovable_persist_staging.py flush

This script flushes staging dir to workspace.
"""
import json
import os
import sys

STAGE = "/workspace/.export-tmp/mcp_responses"
WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"


def enc(path: str) -> str:
    return path.replace("/", "__")


def dec(name: str) -> str:
    return name.replace("__", "/")


def write_file(rel: str, content: str) -> str:
    if not content:
        raise ValueError("empty")
    head = content.lstrip()[:20]
    if rel.endswith(".tsx") and (head.startswith("@import") or head.startswith("@tailwind")):
        raise ValueError("corrupted tsx")
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")
    return "written"


def flush() -> None:
    os.makedirs(STAGE, exist_ok=True)
    ok = fail = skip = 0
    for name in sorted(os.listdir(STAGE)):
        src = os.path.join(STAGE, name)
        if not os.path.isfile(src):
            continue
        rel = dec(name)
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
    data = json.load(open(PENDING, encoding="utf-8"))
    ps = len([p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))])
    print(json.dumps({"written": ok, "failed": fail, "pending_src": ps}))


def stage(rel: str, content: str) -> None:
    os.makedirs(STAGE, exist_ok=True)
    with open(os.path.join(STAGE, enc(rel)), "w", encoding="utf-8") as f:
        f.write(content)
    write_file(rel, content)
    print(f"OK {rel} ({len(content)} bytes)")


def main():
    if len(sys.argv) < 2:
        print("Usage: lovable_persist_staging.py flush|stage REL_PATH (content on stdin)")
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == "flush":
        flush()
    elif cmd == "stage":
        content = sys.stdin.read()
        stage(sys.argv[2], content)
    else:
        print(f"Unknown: {cmd}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
