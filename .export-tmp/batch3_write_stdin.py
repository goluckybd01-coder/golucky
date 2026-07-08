#!/usr/bin/env python3
"""Write batch_3 files from JSON stdin: {path: content, ...}. Skips existing."""
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
    data = json.load(sys.stdin)
    written = skipped = failed = 0
    failures = []
    for path, content in data.items():
        if content is None:
            failed += 1
            failures.append(path)
            continue
        try:
            result = write_file(path, content)
            if result == "written":
                written += 1
            else:
                skipped += 1
        except Exception as e:
            failed += 1
            failures.append({"path": path, "error": str(e)})
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures[:5]}))


if __name__ == "__main__":
    main()
