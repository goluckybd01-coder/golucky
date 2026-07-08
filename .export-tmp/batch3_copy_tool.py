#!/usr/bin/env python3
"""Copy staged tool-output files to workspace paths. Skips existing."""
import json
import os
import shutil
import sys

WORKSPACE = "/workspace"
MAP_FILE = "/workspace/.export-tmp/batch3_path_map.json"


def write_file(rel, content):
    full = os.path.join(WORKSPACE, rel)
    if os.path.isfile(full):
        return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"


def copy_from_map():
    mapping = json.load(open(MAP_FILE, encoding="utf-8"))
    written = skipped = failed = 0
    failures = []
    for rel, src in mapping.items():
        try:
            with open(src, encoding="utf-8") as f:
                content = f.read()
            r = write_file(rel, content)
            if r == "written":
                written += 1
            else:
                skipped += 1
        except Exception as e:
            failed += 1
            failures.append({"path": rel, "error": str(e)})
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures}))


if __name__ == "__main__":
    copy_from_map()
