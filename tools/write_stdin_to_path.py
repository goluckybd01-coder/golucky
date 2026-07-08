#!/usr/bin/env python3
"""Write stdin to workspace path via mcp_immediate_write.py. Usage: write_stdin_to_path.py <rel-path>"""
import subprocess
import sys

WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    if len(sys.argv) != 2:
        print("Usage: write_stdin_to_path.py <rel-path>", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    proc = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if proc.returncode:
        print(proc.stderr or proc.stdout, file=sys.stderr)
        sys.exit(proc.returncode)
    print(proc.stdout.strip())


if __name__ == "__main__":
    main()
