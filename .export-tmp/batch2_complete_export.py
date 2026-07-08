#!/usr/bin/env python3
"""Batch 2 export driver: save-stdin, save-json, report."""
import json
import os
import sys

WORKSPACE = "/workspace"
BATCH_FILE = "/workspace/.export-tmp/batch_2.json"


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


def cmd_save_stdin(path):
    content = sys.stdin.read()
    if not content or content.startswith("Lovable API error"):
        print(json.dumps({"path": path, "result": "failed", "error": "empty or error content"}))
        return
    result = write_file(path, content)
    print(json.dumps({"path": path, "result": result, "bytes": len(content)}))


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
    existing = [p for p in batch if os.path.isfile(os.path.join(WORKSPACE, p))]
    pen = [p for p in batch if p not in existing]
    print(json.dumps({
        "total": len(batch),
        "written": len(existing),
        "skipped": len(existing),
        "pending": len(pen),
        "failed": 0,
    }))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "report"
    if cmd == "next":
        cmd_next(sys.argv[2] if len(sys.argv) > 2 else 25)
    elif cmd == "save-stdin" and len(sys.argv) > 2:
        cmd_save_stdin(sys.argv[2])
    elif cmd == "save-json" and len(sys.argv) > 2:
        cmd_save_json(sys.argv[2])
    elif cmd == "report":
        cmd_report()
    else:
        print("Usage: batch2_complete_export.py [next N|save-stdin PATH|save-json FILE|report]")
        sys.exit(1)
