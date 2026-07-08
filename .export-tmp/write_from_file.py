#!/usr/bin/env python3
"""Write file from content path arg to workspace (skip existing)."""
import os
import sys

WORKSPACE = "/workspace"

def main():
    if len(sys.argv) < 3:
        print("Usage: write_from_file.py REL_PATH CONTENT_FILE")
        sys.exit(1)
    rel = sys.argv[1]
    content_file = sys.argv[2]
    dest = os.path.join(WORKSPACE, rel)
    if os.path.isfile(dest):
        print(f"skipped {rel}")
        return
    with open(content_file, encoding="utf-8") as f:
        content = f.read()
    if not content or content.startswith("Lovable API error"):
        print(f"failed {rel}: bad content")
        sys.exit(1)
    os.makedirs(os.path.dirname(dest) or WORKSPACE, exist_ok=True)
    with open(dest, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    print(f"written {rel} ({len(content)} bytes)")

if __name__ == "__main__":
    main()
