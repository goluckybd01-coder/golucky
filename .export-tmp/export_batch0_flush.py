#!/usr/bin/env python3
"""Flush batch_0 paths from mcp_cache to workspace, skipping existing files."""
import json, os, glob

WORKSPACE = "/workspace"
CACHE = "/workspace/.export-tmp/mcp_cache"
BATCH = "/workspace/.export-tmp/batch_0.json"

def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")

def main():
    paths = json.load(open(BATCH, encoding="utf-8"))
    exported = skipped = 0
    failures = []
    for path in paths:
        dest = os.path.join(WORKSPACE, path)
        if os.path.isfile(dest):
            skipped += 1
            continue
        cache = os.path.join(CACHE, path.replace("/", "__"))
        if not os.path.isfile(cache):
            failures.append({"path": path, "error": "not cached"})
            continue
        try:
            content = open(cache, encoding="utf-8").read()
            if not content or content.startswith("Lovable API error"):
                failures.append({"path": path, "error": "invalid content"})
                continue
            write_file(path, content)
            exported += 1
        except Exception as e:
            failures.append({"path": path, "error": str(e)})
    print(json.dumps({"exported": exported, "skipped": skipped, "failures": failures}, indent=2))

if __name__ == "__main__":
    main()
