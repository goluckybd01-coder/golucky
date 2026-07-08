#!/usr/bin/env python3
"""Write one file from base64 arg. Usage: write_b64.py REL_PATH BASE64"""
import base64
import sys

sys.path.insert(0, "/workspace/tools")
from mcp_batch_export import write_file


def main():
    if len(sys.argv) != 3:
        print("Usage: write_b64.py REL_PATH BASE64", file=sys.stderr)
        sys.exit(1)
    rel, b64 = sys.argv[1], sys.argv[2]
    content = base64.b64decode(b64).decode("utf-8")
    write_file(rel, content)
    print(f"OK {rel} ({len(content)} bytes)")


if __name__ == "__main__":
    main()
