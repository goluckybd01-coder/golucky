#!/usr/bin/env python3
"""Write workspace file via batch32_pipe_write from a content file. Usage: batch32_from_file.py REL_PATH CONTENT_FILE"""
import subprocess
import sys

PIPE = "/workspace/tools/batch32_pipe_write.py"


def main():
    if len(sys.argv) != 3:
        print("Usage: batch32_from_file.py REL_PATH CONTENT_FILE", file=sys.stderr)
        sys.exit(1)
    rel, src = sys.argv[1], sys.argv[2]
    with open(src, encoding="utf-8") as f:
        content = f.read()
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
