#!/usr/bin/env python3
"""Apply path->content dict from JSON file to /workspace (skip existing)."""
import json
import os
import sys

WORKSPACE = "/workspace"


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


def main():
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    written = skipped = failed = 0
    failures = []
    for path, content in data.items():
        if content is None:
            failed += 1
            failures.append(path)
            continue
        try:
            r = write_file(path, content)
            if r == "written":
                written += 1
            else:
                skipped += 1
        except Exception as e:
            failed += 1
            failures.append({"path": path, "error": str(e)})
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures[:5]}))


if __name__ == "__main__":
    main()
