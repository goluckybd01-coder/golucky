#!/usr/bin/env python3
"""Flush all .content staging files to workspace paths."""
import glob
import os
import sys

WORKSPACE = "/workspace"
STAGING = "/workspace/.export-tmp/staging"

def path_from_name(name: str) -> str:
    if name.endswith(".content"):
        name = name[:-8]
    return name.replace("__", "/")

def main():
    written = 0
    for f in sorted(glob.glob(os.path.join(STAGING, "*.content"))):
        base = os.path.basename(f)
        rel = path_from_name(base)
        with open(f, encoding="utf-8") as inf:
            content = inf.read()
        if not content.strip() or content.strip() == "PLACEHOLDER":
            print(f"SKIP bad {rel}")
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
        print(f"OK {rel}")
        written += 1
    print(f"Flushed {written} files")

if __name__ == "__main__":
    main()
