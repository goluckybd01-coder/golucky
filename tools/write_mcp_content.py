#!/usr/bin/env python3
"""Write file from content file. Usage: write_mcp_content.py REL_PATH CONTENT_FILE"""
import sys

sys.path.insert(0, "/workspace/tools")
from mcp_batch_export import write_file


def main():
    if len(sys.argv) != 3:
        print("Usage: write_mcp_content.py REL_PATH CONTENT_FILE", file=sys.stderr)
        sys.exit(1)
    rel, src = sys.argv[1], sys.argv[2]
    with open(src, encoding="utf-8") as f:
        content = f.read()
    write_file(rel, content)
    print(f"OK {rel} ({len(content)} bytes)")


if __name__ == "__main__":
    main()
