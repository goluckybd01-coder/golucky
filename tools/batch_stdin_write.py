#!/usr/bin/env python3
"""Pipe content file to mcp_immediate_write.py. Usage: batch_stdin_write.py REL_PATH CONTENT_FILE"""
import subprocess
import sys

WRITE = "/workspace/tools/mcp_immediate_write.py"

def main():
    if len(sys.argv) != 3:
        print("Usage: batch_stdin_write.py REL_PATH CONTENT_FILE", file=sys.stderr)
        sys.exit(1)
    rel, src = sys.argv[1], sys.argv[2]
    with open(src, encoding="utf-8") as f:
        content = f.read()
    proc = subprocess.run([sys.executable, WRITE, rel], input=content, text=True, capture_output=True)
    if proc.returncode != 0:
        print(proc.stderr or proc.stdout, file=sys.stderr)
        sys.exit(proc.returncode)
    print(proc.stdout.strip())

if __name__ == "__main__":
    main()
