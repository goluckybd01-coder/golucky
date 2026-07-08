#!/usr/bin/env python3
"""Write all batch_2 paths from staging tree to workspace (skip existing)."""
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


def main():
    batch = json.load(open(BATCH_FILE, encoding="utf-8"))
    written = skipped = missing = 0
    missing_paths = []
    for rel in batch:
        dest = os.path.join(WORKSPACE, rel)
        if os.path.isfile(dest):
            skipped += 1
            continue
        src = os.path.join(STAGING, rel)
        if not os.path.isfile(src):
            missing += 1
            missing_paths.append(rel)
            continue
        with open(src, encoding="utf-8") as f:
            content = f.read()
        if write_file(rel, content) == "written":
            written += 1
        else:
            skipped += 1
    total = len(batch)
    on_disk = sum(1 for p in batch if os.path.isfile(os.path.join(WORKSPACE, p)))
    print(json.dumps({
        "total": total,
        "written": written,
        "skipped": skipped,
        "missing_staging": missing,
        "missing_paths": missing_paths[:20],
        "on_disk": on_disk,
        "pending": total - on_disk,
        "failed": 0,
    }))


if __name__ == "__main__":
    main()
