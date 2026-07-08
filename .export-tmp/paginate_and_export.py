#!/usr/bin/env python3
"""Helper to write exported file contents to workspace."""
import json
import os
import sys

WORKSPACE = "/workspace"

def write_file(rel_path: str, content: str) -> None:
    full_path = os.path.join(WSPACE := WORKSPACE, rel_path)
    os.makedirs(os.path.dirname(full_path) or WORKSPACE, exist_ok=True)
    with open(full_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")

def main():
    if len(sys.argv) < 2:
        print("Usage: paginate_and_export.py <json_file>")
        sys.exit(1)
    with open(sys.argv[1]) as f:
        data = json.load(f)
    exported = 0
    failures = []
    for item in data:
        path = item.get("path")
        content = item.get("content")
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
