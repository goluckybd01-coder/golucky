#!/usr/bin/env python3
"""Write pending batch_2 files from JSON map file(s). Skips existing."""
import glob
import json
import os
import sys

WORKSPACE = "/workspace"
BATCH_FILE = "/workspace/.export-tmp/batch_2.json"
INCOMING = "/workspace/.export-tmp/incoming"


def load_batch():
    return json.load(open(BATCH_FILE, encoding="utf-8"))


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


def flush_maps(pattern=None):
    written = skipped = failed = 0
    failures = []
    paths = pattern or os.path.join(INCOMING, "batch2_*.json")
    for jf in sorted(glob.glob(paths)):
        try:
            data = json.load(open(jf, encoding="utf-8"))
        except Exception as e:
            failed += 1
            failures.append({"file": jf, "error": str(e)})
            continue
        for rel, content in data.items():
            if content is None or str(content).startswith("Lovable API error"):
                failed += 1
                failures.append(rel)
                continue
            r = write_file(rel, content)
            if r == "written":
                written += 1
            else:
                skipped += 1
    return {"written": written, "skipped": skipped, "failed": failed, "failures": failures}


def report():
    batch = load_batch()
    existing = sum(1 for p in batch if os.path.isfile(os.path.join(WORKSPACE, p)))
    pending = len(batch) - existing
    return {"total": len(batch), "written": existing, "skipped": existing, "pending": pending, "failed": 0}


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "report"
    if cmd == "flush":
        print(json.dumps(flush_maps()))
    elif cmd == "flush-file" and len(sys.argv) > 2:
        print(json.dumps(flush_maps(sys.argv[2])))
    elif cmd == "report":
        print(json.dumps(report()))
    else:
        print("Usage: batch2_flush_pending.py [flush|flush-file PATH|report]")
        sys.exit(1)
