#!/usr/bin/env python3
"""Write MCP batch JSON to reads/ cache and workspace.

Usage:
  python3 save_reads_from_mcp.py <batch.json>

batch.json format: [{"path": "src/foo.tsx", "content": "..."}, ...]
"""
import json
import os
import sys

WORKSPACE = "/workspace"
READS = os.path.join(WORKSPACE, ".export-tmp", "reads")


def safe(path: str) -> str:
    return path.replace("/", "__")


def write_file(rel: str, content: str) -> None:
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")


def main():
    batch_path = sys.argv[1]
    with open(batch_path, encoding="utf-8") as f:
        items = json.load(f)
    os.makedirs(READS, exist_ok=True)
    exported = 0
    failures = []
    for item in items:
        path = item.get("path")
        content = item.get("content")
        if not path or content is None:
            failures.append({"path": path, "error": "missing path or content"})
            continue
        try:
            cf = os.path.join(READS, safe(path) + ".content")
            with open(cf, "w", encoding="utf-8", newline="\n") as f:
                f.write(content)
                if content and not content.endswith("\n"):
                    f.write("\n")
            write_file(path, content)
            exported += 1
        except Exception as e:
            failures.append({"path": path, "error": str(e)})
    print(json.dumps({"exported": exported, "failures": failures}))

if __name__ == "__main__":
    main()
