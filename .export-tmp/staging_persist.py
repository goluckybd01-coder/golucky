#!/usr/bin/env python3
"""Write staged files from .export-tmp/staging/{rel_path} to /workspace/{rel_path}."""
import json
import os
import sys

WORKSPACE = "/workspace"
STAGING = "/workspace/.export-tmp/staging"
BATCH_FILE = "/workspace/.export-tmp/batch_2.json"


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


def stage_file(rel, content):
    path = os.path.join(STAGING, rel)
    os.makedirs(os.path.dirname(path) or STAGING, exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")


def flush():
    batch = json.load(open(BATCH_FILE, encoding="utf-8"))
    written = skipped = failed = 0
    for rel in batch:
        src = os.path.join(STAGING, rel)
        if not os.path.isfile(src):
            if not os.path.isfile(os.path.join(WORKSPACE, rel)):
                failed += 1
            continue
        with open(src, encoding="utf-8") as f:
            content = f.read()
        result = write_file(rel, content)
        if result == "written":
            written += 1
        else:
            skipped += 1
    existing = sum(1 for p in batch if os.path.isfile(os.path.join(WORKSPACE, p)))
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "total": len(batch), "exported": existing, "pending": len(batch) - existing}))


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "flush":
        flush()
    elif len(sys.argv) > 2 and sys.argv[1] == "stage-stdin":
        rel = sys.argv[2]
        stage_file(rel, sys.stdin.read())
        print(json.dumps({"staged": rel}))
    else:
        print("Usage: staging_persist.py flush | stage-stdin PATH")
