#!/usr/bin/env python3
"""
Batch 1 export helper: write files from JSON chunks in incoming/.
Usage:
  python3 batch1_mcp_loop.py pending [N]   - list next N pending paths
  python3 batch1_mcp_loop.py write CHUNK   - write from incoming/CHUNK.json
  python3 batch1_mcp_loop.py report        - status counts
"""
import glob
import json
import os
import sys

WORKSPACE = "/workspace"
BATCH = "/workspace/.export-tmp/batch_1.json"
INCOMING = "/workspace/.export-tmp/incoming"


def load_batch():
    return json.load(open(BATCH, encoding="utf-8"))


def pending_paths():
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


def write_chunk(name):
    path = name if name.endswith(".json") else f"{name}.json"
    if not os.path.isabs(path):
        path = os.path.join(INCOMING, path)
    if not os.path.isfile(path):
        print(json.dumps({"error": f"not found: {path}"}))
        return
    data = json.load(open(path, encoding="utf-8"))
    stats = {"written": 0, "skipped": 0, "failed": 0}
    for rel, content in data.items():
        r = write_file(rel, content)
        stats[r if r in stats else "failed"] += 1
    print(json.dumps({**stats, **report()}))


def report():
    batch = load_batch()
    existing = sum(1 for p in batch if os.path.isfile(os.path.join(WORKSPACE, p)))
    return {"total": len(batch), "written": existing, "skipped": 0, "pending": len(batch) - existing}


def flush_all():
    stats = {"written": 0, "skipped": 0, "failed": 0}
    for jf in sorted(glob.glob(os.path.join(INCOMING, "*.json"))):
        if os.path.getsize(jf) == 0:
            continue
        try:
            data = json.load(open(jf, encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        if not isinstance(data, dict):
            continue
        for rel, content in data.items():
            r = write_file(rel, content)
            stats[r if r in stats else "failed"] += 1
    print(json.dumps({**stats, **report()}))


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "report"
    if cmd == "pending":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 25
        pen = pending_paths()
        print(json.dumps({"pending": len(pen), "batch": pen[:n]}))
    elif cmd == "write":
        write_chunk(sys.argv[2])
    elif cmd == "flush":
        flush_all()
    else:
        print(json.dumps(report()))


if __name__ == "__main__":
    main()
