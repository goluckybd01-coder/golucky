#!/usr/bin/env python3
"""Write files from JSON map file: {"path": "content", ...}"""
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
    if len(sys.argv) < 2:
        print("usage: batch2_apply_map.py MAP.json", file=sys.stderr)
        sys.exit(1)
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    written = skipped = failed = 0
    failures = []
    for rel, content in data.items():
        if not content or str(content).startswith("Lovable API error"):
            failed += 1
            failures.append(rel)
            continue
        r = write_file(rel, content)
        if r == "written":
            written += 1
        else:
            skipped += 1
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures}))


if __name__ == "__main__":
    main()
