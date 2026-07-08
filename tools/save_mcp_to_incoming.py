#!/usr/bin/env python3
"""Save stdin to mcp_incoming and write via mcp_immediate_write. Usage: save_mcp_to_incoming.py <rel-path>"""
import os
import subprocess
import sys

INCOMING = "/workspace/.export-tmp/mcp_incoming"
WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    if len(sys.argv) != 2:
        print("Usage: save_mcp_to_incoming.py <rel-path>", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    if not content:
        print(f"ERROR empty: {rel}", file=sys.stderr)
        sys.exit(1)
    os.makedirs(INCOMING, exist_ok=True)
    stage = os.path.join(INCOMING, rel.replace("/", "__"))
    with open(stage, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode:
        print(r.stderr or r.stdout, file=sys.stderr)
        sys.exit(1)
    print(r.stdout.strip())


if __name__ == "__main__":
    main()
