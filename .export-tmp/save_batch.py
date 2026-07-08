#!/usr/bin/env python3
"""Write batch from JSON stdin or file: [{"path": "...", "content": "..."}]"""
import json
import os
import sys

WORKSPACE = "/workspace"

def write_file(rel_path: str, content: str) -> None:
    full_path = os.path.join(WORKSPACE, rel_path)
    parent = os.path.dirname(full_path)
    if parent:
        os.makedirs(parent, exist_ok=True)
    with open(full_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")

def main():
    src = sys.argv[1] if len(sys.argv) > 1 else None
    if src:
        with open(src, encoding="utf-8") as f:
            items = json.load(f)
    else:
        items = json.load(sys.stdin)
    exported = 0
    failures = []
    for item in items:
        path = item.get("path")
        content = item.get("content")
        if not path:
            continue
        if content is None:
            failures.append({"path": path, "error": item.get("error", "no content")})
            continue
        try:
            write_file(path, content)
            exported += 1
        except Exception as e:
            failures.append({"path": path, "error": str(e)})
    print(json.dumps({"exported": exported, "failures": failures}))

if __name__ == "__main__":
    main()
