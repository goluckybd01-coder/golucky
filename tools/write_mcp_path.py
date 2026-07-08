#!/usr/bin/env python3
"""Write MCP read result from stdin to workspace path. Overwrites."""
import os
import sys

WORKSPACE = "/workspace"

def main():
    if len(sys.argv) != 2:
        print("Usage: write_mcp_path.py REL_PATH", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    if not content.strip():
        print(f"ERROR empty content for {rel}", file=sys.stderr)
        sys.exit(1)
    if content.lstrip().startswith("@import") or content.lstrip().startswith("@tailwind"):
        print(f"ERROR corrupted CSS in {rel}", file=sys.stderr)
        sys.exit(1)
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")
    print(f"OK {rel} ({len(content)} bytes)")

if __name__ == "__main__":
    main()
