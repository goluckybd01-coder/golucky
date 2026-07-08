#!/usr/bin/env python3
"""Write cached MCP content files to workspace. Cache: .export-tmp/mcp_cache/<path_with__>.txt"""
import glob
import os
import sys

WORKSPACE = "/workspace"
CACHE = "/workspace/.export-tmp/mcp_cache"


def path_from_cache_name(name: str) -> str:
    return name.replace("__", "/")


def main():
    os.makedirs(CACHE, exist_ok=True)
    written = skipped = 0
    targets = sys.argv[1:] if len(sys.argv) > 1 else None
    for f in sorted(glob.glob(os.path.join(CACHE, "*.txt"))):
        rel = path_from_cache_name(os.path.basename(f)[:-4])
        if targets and rel not in targets:
            continue
        with open(f, encoding="utf-8") as inf:
            content = inf.read()
        if not content.strip():
            print(f"SKIP empty {rel}")
            continue
        if content.lstrip().startswith("@import") or content.lstrip().startswith("@tailwind"):
            print(f"SKIP corrupted {rel}")
            continue
        full = os.path.join(WORKSPACE, rel)
        os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
        with open(full, "w", encoding="utf-8", newline="\n") as out:
            out.write(content)
            if not content.endswith("\n"):
                out.write("\n")
        print(f"OK {rel} ({len(content)} bytes)")
        written += 1
    print(f"Flushed {written} files")

if __name__ == "__main__":
    main()
