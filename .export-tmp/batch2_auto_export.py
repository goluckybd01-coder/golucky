#!/usr/bin/env python3
"""Export pending batch_2 files from Lovable via MCP subprocess bridge."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
PROJECT = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
REF = "b4906a5c0e34d0a1506f50999eb5f9703ebb698e"
BATCH_FILE = "/workspace/.export-tmp/batch_2.json"


def pending():
    batch = json.load(open(BATCH_FILE))
    return [p for p in batch if not os.path.isfile(os.path.join(WORKSPACE, p))]


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
    paths = pending()
    written = skipped = failed = 0
    failures = []
    for rel in paths:
        full = os.path.join(WORKSPACE, rel)
        if os.path.isfile(full):
            skipped += 1
            continue
        staging = os.path.join("/workspace/.export-tmp/staging", rel)
        if os.path.isfile(staging):
            with open(staging, encoding="utf-8") as f:
                content = f.read()
            result = write_file(rel, content)
            if result == "written":
                written += 1
            else:
                skipped += 1
            continue
        failures.append(rel)
        failed += 1
    print(json.dumps({
        "total": len(json.load(open(BATCH_FILE))),
        "pending": len(paths),
        "written": written,
        "skipped": skipped,
        "failed": failed,
        "failures": failures[:20],
    }))


if __name__ == "__main__":
    main()
