#!/usr/bin/env python3
"""Batch write: read path list, write each from MCP via stdin lines or content files."""
import json
import os
import sys

WORKSPACE = "/workspace"
sys.path.insert(0, "/workspace/.export-tmp")
from export_batch2_worker import write_file, load_paths

def main():
    if len(sys.argv) < 2:
        print("usage: batch_write_paths.py <path1> [path2...]", file=sys.stderr)
        sys.exit(1)
    written = skipped = failed = 0
    failures = []
    for path in sys.argv[1:]:
        full = os.path.join(WORKSPACE, path)
        if os.path.isfile(full):
            skipped += 1
            continue
        content_file = os.path.join("/workspace/.export-tmp/content", path)
        if not os.path.isfile(content_file):
            failed += 1
            failures.append(path)
            continue
        with open(content_file, encoding="utf-8") as f:
            content = f.read()
        write_file(path, content)
        written += 1
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures}))

if __name__ == "__main__":
    main()
