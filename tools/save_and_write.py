#!/usr/bin/env python3
"""Save content to path via mcp_immediate_write. Usage: save_and_write.py <rel-path> <content-file>"""
import subprocess
import sys

WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    if len(sys.argv) != 3:
        print("Usage: save_and_write.py <rel-path> <content-file>", file=sys.stderr)
        sys.exit(1)
    rel, src = sys.argv[1], sys.argv[2]
    content = open(src, encoding="utf-8").read()
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode:
        print(r.stderr or r.stdout, file=sys.stderr)
        sys.exit(r.returncode)
    print(r.stdout.strip())


if __name__ == "__main__":
    main()
