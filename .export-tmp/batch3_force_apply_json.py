#!/usr/bin/env python3
"""Apply path->content JSON to /workspace (always overwrite)."""
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
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    written, failed = [], []
    for path, content in data.items():
        if content is None or str(content).startswith("Lovable API error"):
            failed.append({"path": path, "error": "empty or API error"})
            continue
        try:
            write_file(path, content)
            written.append(path)
        except Exception as e:
            failed.append({"path": path, "error": str(e)})
    print(json.dumps({"written": len(written), "failed": failed, "paths_written": sorted(written)}))


if __name__ == "__main__":
    main()
