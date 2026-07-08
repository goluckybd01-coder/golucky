#!/usr/bin/env python3
"""
Write batch_1 files from JSON chunks in incoming/.
Agent workflow: MCP read -> save chunk JSON -> run this script.
"""
import glob
import json
import os
import sys

WORKSPACE = "/workspace"
BATCH_FILE = "/workspace/.export-tmp/batch_1.json"
INCOMING = "/workspace/.export-tmp/incoming"


def load_batch():
    return json.load(open(BATCH_FILE, encoding="utf-8"))


def write_file(rel, content):
    full = os.path.join(WORKSPACE, rel)
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


def flush_incoming():
    stats = {"written": 0, "skipped": 0, "failed": 0}
    for jf in sorted(glob.glob(os.path.join(INCOMING, "*.json"))):
        if os.path.getsize(jf) == 0:
            continue
        try:
            data = json.load(open(jf, encoding="utf-8"))
        except json.JSONDecodeError as e:
            print(f"ERR {jf}: {e}", file=sys.stderr)
            continue
        if not isinstance(data, dict):
            continue
        for path, content in data.items():
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


def pending(n=25):
    batch = load_batch()
    pen = [p for p in batch if not os.path.isfile(os.path.join(WORKSPACE, p))]
    return pen[:n], len(pen)


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "report"
    if cmd == "flush":
        s = flush_incoming()
        print(json.dumps({**s, **report()}))
    elif cmd == "pending":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 25
        batch, total = pending(n)
        print(json.dumps({"pending": total, "batch": batch, "count": len(batch)}))
    elif cmd == "save-json":
        path = sys.argv[2]
        data = json.load(open(path, encoding="utf-8"))
        stats = {"written": 0, "skipped": 0, "failed": 0}
        for rel, content in data.items():
            r = write_file(rel, content)
            stats[r if r in stats else "failed"] += 1
        print(json.dumps({**stats, **report()}))
    else:
        print(json.dumps(report()))
