#!/usr/bin/env python3
"""Batch 1 export helpers (write-json, status, pending)."""
import json
import os
import sys

WORKSPACE = "/workspace"
BATCH = "/workspace/.export-tmp/batch_1.json"


def write_file(path: str, content: str) -> str:
    dest = os.path.join(WORKSPACE, path)
    if os.path.isfile(dest):
        return "skipped"
    os.makedirs(os.path.dirname(dest) or WORKSPACE, exist_ok=True)
    with open(dest, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"


def pending():
    batch = json.load(open(BATCH))
    return [p for p in batch if not os.path.isfile(os.path.join(WORKSPACE, p))]


def status():
    batch = json.load(open(BATCH))
    on_disk = sum(1 for p in batch if os.path.isfile(os.path.join(WORKSPACE, p)))
    return {
        "total": len(batch),
        "written": on_disk,
        "skipped": 0,
        "pending": len(batch) - on_disk,
    }


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "pending":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 25
        p = pending()
        print(json.dumps({"pending": len(p), "batch": p[:n], "count": min(n, len(p))}))
        return
    if cmd == "status":
        print(json.dumps(status()))
        return
    if cmd == "write-json" and len(sys.argv) >= 3:
        data = json.load(open(sys.argv[2], encoding="utf-8"))
        written = skipped = failed = 0
        for path, content in data.items():
            if not content or str(content).startswith("Lovable API error"):
                failed += 1
                continue
            r = write_file(path, content)
            if r == "skipped":
                skipped += 1
            else:
                written += 1
        s = status()
        s.update({"batch_written": written, "batch_skipped": skipped, "batch_failed": failed})
        print(json.dumps(s))
        return
    if cmd == "write-stdin":
        data = json.load(sys.stdin)
        written = skipped = failed = 0
        for path, content in data.items():
            if not content or str(content).startswith("Lovable API error"):
                failed += 1
                continue
            r = write_file(path, content)
            if r == "skipped":
                skipped += 1
            else:
                written += 1
        print(json.dumps(status()))
        return
    print("Usage: export_batch1_runner.py [status|pending N|write-json FILE|write-stdin]")


if __name__ == "__main__":
    main()
