#!/usr/bin/env python3
"""Write REL_PATH from CONTENT_FILE via mcp_immediate_write. Usage: pipe_write_path.py REL CONTENT_FILE"""
import subprocess
import sys

WRITE = "/workspace/tools/mcp_immediate_write.py"

def main():
    rel, content_file = sys.argv[1], sys.argv[2]
    content = open(content_file, encoding="utf-8").read()
    r = subprocess.run([sys.executable, WRITE, rel], input=content, text=True, capture_output=True)
    if r.returncode:
        print(r.stderr or r.stdout, file=sys.stderr)
        sys.exit(1)
    print(r.stdout.strip())

if __name__ == "__main__":
    main()
