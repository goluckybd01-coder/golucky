#!/usr/bin/env python3
"""Write stdin content to workspace path (always overwrite)."""
import os
import sys

WORKSPACE = "/workspace"

def main():
    if len(sys.argv) < 2:
        print("usage: batch3_force_write.py <rel-path>", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    if not content or content.startswith("Lovable API error"):
        print(f"FAIL {rel}: empty or error content", file=sys.stderr)
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
