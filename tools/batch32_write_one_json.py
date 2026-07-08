#!/usr/bin/env python3
"""Write one file from JSON arg: {"path": "...", "content": "..."} via batch32_pipe_write."""
import json
import subprocess
import sys

PIPE = "/workspace/tools/batch32_pipe_write.py"


def main():
    data = json.loads(sys.argv[1]) if len(sys.argv) > 1 else json.load(sys.stdin)
    rel = data["path"]
    content = data["content"]
    r = subprocess.run(
        [sys.executable, PIPE, rel],
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
