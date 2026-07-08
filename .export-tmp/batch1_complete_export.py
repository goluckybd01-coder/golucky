#!/usr/bin/env python3
"""Batch 1 export driver - same pattern as batch3_complete_export.py"""
import json
import os
import sys

WORKSPACE = "/workspace"
BATCH_FILE = "/workspace/.export-tmp/batch_1.json"


def load_batch():
    return json.load(open(BATCH_FILE, encoding="utf-8"))


def missing():
    batch = load_batch()
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


def cmd_next(n=25):
    pen = missing()
    batch = pen[: int(n)]
    print(json.dumps({"pending": len(pen), "batch": batch, "count": len(batch)}))


def cmd_save_json(path):
    data = json.load(open(path, encoding="utf-8"))
    written = skipped = failed = 0
    failures = []
    for rel, content in data.items():
        if content is None or str(content).startswith("Lovable API error"):
            failed += 1
            failures.append(rel)
            continue
        result = write_file(rel, content)
        if result == "written":
            written += 1
        elif result == "skipped":
            skipped += 1
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures}))


def cmd_report():
    batch = load_batch()
    existing = sum(1 for p in batch if os.path.isfile(os.path.join(WORKSPACE, p)))
    print(json.dumps({"total": len(batch), "written": existing, "skipped": 0, "pending": len(batch) - existing}))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        cmd_report()
    elif sys.argv[1] == "next":
        cmd_next(int(sys.argv[2]) if len(sys.argv) > 2 else 25)
    elif sys.argv[1] == "save-json":
        cmd_save_json(sys.argv[2])
    elif sys.argv[1] == "report":
        cmd_report()
    else:
        print("Usage: batch1_complete_export.py [next N|save-json PATH|report]")
