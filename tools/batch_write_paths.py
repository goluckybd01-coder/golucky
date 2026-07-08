#!/usr/bin/env python3
"""Write files from JSON {path: content} file argument."""
import json
import os
import sys

WORKSPACE = "/workspace"

def write_file(rel, content):
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    if content and not content.endswith("\n"):
        content += "\n"
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    return len(content)

def main():
    if len(sys.argv) != 2:
        print("Usage: batch_write_paths.py <json-file>", file=sys.stderr)
        sys.exit(1)
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    for path, content in data.items():
        n = write_file(path, content)
        print(f"Wrote {path} ({n} bytes)")
    print(f"Total: {len(data)} files")

if __name__ == "__main__":
    main()
