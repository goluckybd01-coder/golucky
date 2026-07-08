#!/usr/bin/env python3
"""Write one batch_3 file from stdin. Skips if already exists."""
import os
import sys

WORKSPACE = "/workspace"


def write_file(rel, content):
    full = os.path.join(WORKSPACE, rel)
    if os.path.isfile(full):
        return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: batch3_stage.py <path>", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    result = write_file(rel, content)
    print(result)
