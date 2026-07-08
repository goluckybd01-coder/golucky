#!/usr/bin/env python3
"""Write one file from stdin immediately. Usage: export_one.py REL_PATH < content"""
import sys
sys.path.insert(0, "/workspace/tools")
from mcp_batch_export import write_file

def main():
    if len(sys.argv) != 2:
        print("Usage: export_one.py REL_PATH", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    write_file(rel, content)
    print(f"OK {rel} ({len(content)} bytes)")

if __name__ == "__main__":
    main()
