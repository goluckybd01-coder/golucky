#!/usr/bin/env python3
"""Write exported files from JSON batch: [{path, content}, ...]"""
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
    batch_path = sys.argv[1] if len(sys.argv) > 1 else "/workspace/.export-tmp/batch.json"
    with open(batch_path) as f:
        items = json.load(f)
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
    result = {"exported": exported, "failures": failures}
    print(json.dumps(result))
    with open(batch_path.replace(".json", "_result.json"), "w") as f:
        json.dump(result, f, indent=2)

if __name__ == "__main__":
    main()
