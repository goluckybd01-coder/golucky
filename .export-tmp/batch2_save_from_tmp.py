#!/usr/bin/env python3
"""Write workspace file from tmp content file. Skip if exists."""
import json
import os
import sys

WORKSPACE = "/workspace"


def main():
    if len(sys.argv) < 3:
        print("Usage: batch2_save_from_tmp.py <repo-path> <content-file>", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content_path = sys.argv[2]
    with open(content_path, encoding="utf-8") as f:
        content = f.read()
    if not content or content.startswith("Lovable API error"):
        print(json.dumps({"path": rel, "result": "failed", "error": "empty or error content"}))
        sys.exit(1)
    full = os.path.join(WORKSPACE, rel)
    if os.path.isfile(full):
        print(json.dumps({"path": rel, "result": "skipped", "bytes": len(content)}))
        return
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    print(json.dumps({"path": rel, "result": "written", "bytes": len(content)}))


if __name__ == "__main__":
    main()
