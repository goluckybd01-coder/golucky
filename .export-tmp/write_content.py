#!/usr/bin/env python3
"""Write file content to workspace preserving exact content."""
import os
import sys

WORKSPACE = "/workspace"

def write_file(rel_path: str, content: str) -> None:
    full = os.path.join(WORKSPACE, rel_path)
    parent = os.path.dirname(full)
    if parent:
        os.makedirs(parent, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="") as f:
        f.write(content)

def main():
    rel_path = sys.argv[1]
    content_path = sys.argv[2]
    with open(content_path, encoding="utf-8") as f:
        content = f.read()
    write_file(rel_path, content)
    print(f"OK {rel_path} ({len(content)} bytes)")

if __name__ == "__main__":
    main()
