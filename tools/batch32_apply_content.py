#!/usr/bin/env python3
"""Apply one staged content file via batch32_stage_and_write. Usage: batch32_apply_content.py REL_PATH CONTENT_FILE"""
import subprocess
import sys

STAGE_WRITE = "/workspace/tools/batch32_stage_and_write.py"


def main():
    if len(sys.argv) != 3:
        print("Usage: batch32_apply_content.py REL_PATH CONTENT_FILE", file=sys.stderr)
        sys.exit(1)
    rel, content_file = sys.argv[1], sys.argv[2]
    with open(content_file, encoding="utf-8") as f:
        content = f.read()
    if not content.strip():
        print(f"ERROR empty: {rel}", file=sys.stderr)
        sys.exit(1)
    r = subprocess.run(
        [sys.executable, STAGE_WRITE, rel],
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
