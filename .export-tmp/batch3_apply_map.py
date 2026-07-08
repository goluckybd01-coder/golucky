#!/usr/bin/env python3
"""Apply path->file map JSON: {"rel/path": "/abs/content/file"}"""
import json
import os
import sys

WORKSPACE = "/workspace"

def write_file(rel, content):
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")

def main():
    mapping = json.load(open(sys.argv[1], encoding="utf-8"))
    written, failed = [], []
    for rel, src in mapping.items():
        try:
            with open(src, encoding="utf-8") as f:
                content = f.read()
            if not content or content.startswith("Lovable API error"):
                failed.append({"path": rel, "error": "empty or API error"})
                continue
            write_file(rel, content)
            written.append(rel)
        except Exception as e:
            failed.append({"path": rel, "error": str(e)})
    print(json.dumps({"written": len(written), "failed": failed, "paths_written": written}))

if __name__ == "__main__":
    main()
