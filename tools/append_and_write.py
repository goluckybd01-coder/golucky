#!/usr/bin/env python3
"""Write file from content file and append to export log. Usage: append_and_write.py REL PATH CONTENT_FILE"""
import json
import os
import sys

sys.path.insert(0, "/workspace/tools")
from mcp_batch_export import write_file

LOG = "/workspace/.export-tmp/export_log.jsonl"


def main():
    if len(sys.argv) != 3:
        print("Usage: append_and_write.py REL_PATH CONTENT_FILE", file=sys.stderr)
        sys.exit(1)
    rel, src = sys.argv[1], sys.argv[2]
    with open(src, encoding="utf-8") as f:
        content = f.read()
    write_file(rel, content)
    os.makedirs(os.path.dirname(LOG) or ".", exist_ok=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps({"path": rel, "bytes": len(content)}) + "\n")
    print(f"OK {rel} ({len(content)} bytes)")


if __name__ == "__main__":
    main()
