#!/usr/bin/env python3
"""Append one path->content entry to batch2_cache.json from stdin."""
import json
import os
import sys

CACHE = "/workspace/.export-tmp/batch2_cache.json"


def main():
    if len(sys.argv) < 2:
        print("Usage: batch2_cache_add.py <rel-path>  (stdin=content)", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    if not content or content.startswith("Lovable API error"):
        print(f"FAIL {rel}", file=sys.stderr)
        sys.exit(1)
    data = {}
    if os.path.isfile(CACHE):
        with open(CACHE, encoding="utf-8") as f:
            data = json.load(f)
    data[rel] = content
    with open(CACHE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    full = os.path.join("/workspace", rel)
    if os.path.isfile(full):
        print(f"CACHED+SKIP {rel}")
    else:
        os.makedirs(os.path.dirname(full) or "/workspace", exist_ok=True)
        with open(full, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
            if content and not content.endswith("\n"):
                f.write("\n")
        print(f"CACHED+OK {rel} ({len(content)} bytes)")


if __name__ == "__main__":
    main()
