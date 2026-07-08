#!/usr/bin/env python3
"""Write a single file from MCP read_file response saved as raw text."""
import os
import sys

WORKSPACE = "/workspace"


def main():
    if len(sys.argv) < 3:
        print("Usage: batch2_mcp_to_disk.py <rel-path> <content-file>")
        sys.exit(1)
    rel = sys.argv[1]
    content_path = sys.argv[2]
    full = os.path.join(WORKSPACE, rel)
    if os.path.isfile(full):
        print(f"skipped {rel}")
        return
    with open(content_path, encoding="utf-8") as f:
        content = f.read()
    if not content or content.startswith("Lovable API error"):
        print(f"failed {rel}: empty or error")
        sys.exit(1)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    print(f"written {rel} ({len(content)} bytes)")


if __name__ == "__main__":
    main()
