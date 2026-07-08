#!/usr/bin/env python3
"""
Read JSONL from stdin: {"path":"rel/path","content":"..."} per line.
Write each file immediately to /workspace.
Usage: agent pipes MCP results: echo '{"path":"...","content":"..."}' | python3 mcp_write_loop.py
Or: python3 mcp_write_loop.py batch.jsonl
"""
import json
import os
import sys

WORKSPACE = "/workspace"


def write_one(path: str, content: str) -> None:
    if not content or content.strip() == "PLACEHOLDER":
        raise ValueError("empty or placeholder")
    if content.lstrip().startswith("@import") or content.lstrip().startswith("@tailwind"):
        raise ValueError("corrupted CSS")
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")


def main():
    lines = []
    if len(sys.argv) > 1:
        lines = open(sys.argv[1], encoding="utf-8").readlines()
    else:
        lines = sys.stdin.readlines()
    ok = fail = 0
    for line in lines:
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
            write_one(obj["path"], obj["content"])
            print(f"OK {obj['path']}")
            ok += 1
        except Exception as e:
            print(f"FAIL {line[:80]}: {e}", file=sys.stderr)
            fail += 1
    print(json.dumps({"written": ok, "failed": fail}))


if __name__ == "__main__":
    main()
