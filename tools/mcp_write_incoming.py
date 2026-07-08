#!/usr/bin/env python3
"""Write MCP content file to incoming staging. Usage: mcp_write_incoming.py REL_PATH CONTENT_FILE"""
import os
import shutil
import sys

INCOMING = "/workspace/.export-tmp/incoming"


def main():
    if len(sys.argv) != 3:
        print("Usage: mcp_write_incoming.py REL_PATH CONTENT_FILE", file=sys.stderr)
        sys.exit(1)
    rel, content_file = sys.argv[1], sys.argv[2]
    os.makedirs(INCOMING, exist_ok=True)
    dest = os.path.join(INCOMING, rel.replace("/", "__"))
    shutil.copy2(content_file, dest)
    size = os.path.getsize(dest)
    print(f"STAGED {rel} ({size} bytes)")


if __name__ == "__main__":
    main()
