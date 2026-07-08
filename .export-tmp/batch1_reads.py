#!/usr/bin/env python3
"""
Export batch_1 pending files using content from .export-tmp/reads/*.content
Generate reads/*.content via: python3 save_read.py <path>  (stdin=content)
Then: python3 flush_reads_batch1.py
"""
import json
import os
import sys

READS = "/workspace/.export-tmp/reads"
WORKSPACE = "/workspace"
BATCH = "/workspace/.export-tmp/batch_1.json"


def safe(path: str) -> str:
    return path.replace("/", "__") + ".content"


def save_read(path: str) -> None:
    content = sys.stdin.read()
    os.makedirs(READS, exist_ok=True)
    with open(os.path.join(READS, safe(path)), "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    print(f"SAVED {path} ({len(content)} bytes)")


def pending():
    batch = json.load(open(BATCH))
    return [p for p in batch if not os.path.exists(os.path.join(WORKSPACE, p))]


def flush():
    batch = json.load(open(BATCH))
    written = skipped = missing = 0
    for path in batch:
        dst = os.path.join(WORKSPACE, path)
        if os.path.exists(dst):
            skipped += 1
            continue
        src = os.path.join(READS, safe(path))
        if not os.path.exists(src):
            missing += 1
            continue
        content = open(src, encoding="utf-8").read()
        if not content or content.startswith("Lovable API error"):
            missing += 1
            continue
        os.makedirs(os.path.dirname(dst) or WORKSPACE, exist_ok=True)
        with open(dst, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
            if content and not content.endswith("\n"):
                f.write("\n")
        written += 1
    print(json.dumps({"written": written, "skipped": skipped, "missing": missing, "pending": len(pending())}))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "flush"
    if cmd == "save":
        save_read(sys.argv[2])
    elif cmd == "flush":
        flush()
    elif cmd == "pending":
        print(json.dumps(pending()))
    else:
        print("Usage: batch1_reads.py [save <path>|flush|pending]")
