#!/usr/bin/env python3
"""Save stdin content to staging or workspace path (skip if workspace file exists)."""
import os
import sys

WORKSPACE = "/workspace"
STAGING = "/workspace/.export-tmp/staging"

def main():
    if len(sys.argv) < 2:
        print("usage: mcp_save.py <repo-path> [--direct]", file=sys.stderr)
        sys.exit(1)
    path = sys.argv[1]
    direct = "--direct" in sys.argv
    content = sys.stdin.read()
    dst = os.path.join(WORKSPACE if direct else STAGING, path)
    if direct and os.path.isfile(dst):
        print(f"SKIP {path}")
        return
    os.makedirs(os.path.dirname(dst) or (WORKSPACE if direct else STAGING), exist_ok=True)
    with open(dst, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    print(f"OK {path} ({len(content)} bytes)")

if __name__ == "__main__":
    main()
