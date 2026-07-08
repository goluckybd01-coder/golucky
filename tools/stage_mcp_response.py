#!/usr/bin/env python3
"""Stage MCP content for flush. Usage: stage_mcp_response.py REL_PATH < content"""
import os
import sys

SRC = "/workspace/.export-tmp/mcp_responses"


def main():
    if len(sys.argv) != 2:
        print("Usage: stage_mcp_response.py REL_PATH", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    os.makedirs(SRC, exist_ok=True)
    name = rel.replace("/", "__")
    path = os.path.join(SRC, name)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    print(f"STAGED {rel} ({len(content)} bytes)")


if __name__ == "__main__":
    main()
