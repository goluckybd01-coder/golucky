#!/usr/bin/env python3
"""Write all staged read content files to workspace.

Expects files in .export-tmp/reads/{path_with_slashes_as__}.content
Or JSON batch files passed as arguments.
"""
import json
import os
import sys
import glob

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
    exported = 0
    failures = []
    # JSON batch files
    for arg in sys.argv[1:]:
        if arg.endswith(".json"):
            with open(arg, encoding="utf-8") as f:
                items = json.load(f)
            for item in items:
                path = item.get("path")
                content = item.get("content")
                if not path or content is None:
                    failures.append({"path": path, "error": "missing"})
                    continue
                try:
                    write_file(path, content)
                    exported += 1
                except Exception as e:
                    failures.append({"path": path, "error": str(e)})
    # Staged .content files
    if os.path.isdir(READS):
        for cf in glob.glob(os.path.join(READS, "*.content")):
            rel = os.path.basename(cf).replace("__", "/").replace(".content", "")
            try:
                with open(cf, encoding="utf-8") as f:
                    content = f.read()
                write_file(rel, content)
                exported += 1
            except Exception as e:
                failures.append({"path": rel, "error": str(e)})
    print(json.dumps({"exported": exported, "failures": failures}))

if __name__ == "__main__":
    main()
