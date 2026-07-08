#!/usr/bin/env python3
import os
import sys

WORKSPACE = "/workspace"

def main():
    if len(sys.argv) < 2:
        print("Usage: force_write.py <path>", file=sys.stderr)
        sys.exit(1)
    path = sys.argv[1]
    content = sys.stdin.read()
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    print(f"OK {len(content)} {full}")

if __name__ == "__main__":
    main()
