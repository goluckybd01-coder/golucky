#!/usr/bin/env python3
"""Write path->content mapping from JSON file to workspace. Usage: write_incoming_batch.py chunk.json"""
import json
import os
import sys

WORKSPACE = "/workspace"


def write_file(rel, content):
    if not content or str(content).startswith("Lovable API error"):
        raise ValueError("empty or error content")
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")


def main():
    if len(sys.argv) != 2:
        print("Usage: write_incoming_batch.py chunk.json", file=sys.stderr)
        sys.exit(1)
    mapping = json.load(open(sys.argv[1], encoding="utf-8"))
    ok = fail = 0
    for path, content in mapping.items():
        try:
            write_file(path, content)
            ok += 1
            print(f"OK {path}")
        except Exception as e:
            fail += 1
            print(f"FAIL {path}: {e}", file=sys.stderr)
    print(json.dumps({"written": ok, "failed": fail}))


if __name__ == "__main__":
    main()
