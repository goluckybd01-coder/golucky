#!/usr/bin/env python3
"""Read stdin, stage to batch32_raw/incoming, write via mcp_immediate_write. Usage: batch32_pipe_write.py REL_PATH"""
import os
import subprocess
import sys

WORKSPACE = "/workspace"
RAW = os.path.join(WORKSPACE, ".export-tmp/batch32_raw")
INCOMING = os.path.join(WORKSPACE, ".export-tmp/batch32_incoming")
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")


def enc(rel: str) -> str:
    return rel.replace("/", "__")


def main():
    if len(sys.argv) != 2:
        print("Usage: batch32_pipe_write.py REL_PATH", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    if not content.strip():
        print(f"ERROR empty: {rel}", file=sys.stderr)
        sys.exit(1)
    for d in (RAW, INCOMING):
        os.makedirs(d, exist_ok=True)
        fp = os.path.join(d, enc(rel))
        with open(fp, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
            if not content.endswith("\n"):
                f.write("\n")
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        print(r.stderr or r.stdout, file=sys.stderr)
        sys.exit(1)
    print(r.stdout.strip())


if __name__ == "__main__":
    main()
