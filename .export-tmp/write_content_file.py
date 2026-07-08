#!/usr/bin/env python3
"""Write file via mcp_immediate_write from content file. Usage: write_content_file.py REL_PATH CONTENT_FILE"""
import subprocess
import sys

WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    if len(sys.argv) != 3:
        print("Usage: write_content_file.py REL_PATH CONTENT_FILE", file=sys.stderr)
        sys.exit(1)
    rel, content_file = sys.argv[1], sys.argv[2]
    with open(content_file, encoding="utf-8") as f:
        content = f.read()
    if not content:
        print(f"ERROR empty: {rel}", file=sys.stderr)
        sys.exit(1)
    r = subprocess.run(
        ["python3", WRITE, rel],
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
