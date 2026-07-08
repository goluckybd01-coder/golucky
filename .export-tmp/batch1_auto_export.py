#!/usr/bin/env python3
"""Write batch_1 files from .export-tmp/reads/*.content to /workspace (skip if exists)."""
import json
import os
import sys

WORKSPACE = "/workspace"
BATCH = "/workspace/.export-tmp/batch_1.json"
READS = "/workspace/.export-tmp/reads"


def safe(path: str) -> str:
    return path.replace("/", "__") + ".content"


def load_batch():
    return json.load(open(BATCH, encoding="utf-8"))


def pending():
    return [p for p in load_batch() if not os.path.isfile(os.path.join(WORKSPACE, p))]


def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    if os.path.isfile(full):
        return "skipped"
    if not content or str(content).startswith("Lovable API error"):
        return "failed"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"


def flush_reads():
    stats = {"written": 0, "skipped": 0, "failed": 0, "missing": 0}
    for path in load_batch():
        src = os.path.join(READS, safe(path))
        if not os.path.isfile(src):
            if not os.path.isfile(os.path.join(WORKSPACE, path)):
                stats["missing"] += 1
            continue
        with open(src, encoding="utf-8") as f:
            content = f.read()
        r = write_file(path, content)
        stats[r if r in stats else "failed"] += 1
    return stats


def report():
    batch = load_batch()
    existing = sum(1 for p in batch if os.path.isfile(os.path.join(WORKSPACE, p)))
    return {
        "total": len(batch),
        "written": existing,
        "skipped": 0,
        "pending": len(batch) - existing,
    }


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "report"
    if cmd == "flush":
        print(json.dumps({**flush_reads(), **report()}))
    elif cmd == "pending":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 25
        pen = pending()
        print(json.dumps({"pending": len(pen), "batch": pen[:n], "count": min(n, len(pen))}))
    elif cmd == "report":
        print(json.dumps(report()))
    else:
        print("Usage: batch1_auto_export.py [flush|pending N|report]")
