#!/usr/bin/env python3
"""Batch 3 export helper: status, flush reads/incoming, skip existing."""
import json
import glob
import os
import sys

WORKSPACE = "/workspace"
BATCH_FILE = "/workspace/.export-tmp/batch_3.json"
READS = "/workspace/.export-tmp/reads"
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


def status():
    batch = load_batch()
    existing = [p for p in batch if os.path.isfile(os.path.join(WORKSPACE, p))]
    missing = [p for p in batch if not os.path.isfile(os.path.join(WORKSPACE, p))]
    staged = len(glob.glob(os.path.join(READS, "*.content")))
    incoming = len(glob.glob(os.path.join(INCOMING, "*.json")))
    print(json.dumps({
        "total": len(batch),
        "written": len(existing),
        "missing": len(missing),
        "skipped_existing": len(existing),
        "staged_reads": staged,
        "incoming_batches": incoming,
    }))


def flush_reads():
    written = skipped = failed = 0
    failures = []
    for cf in glob.glob(os.path.join(READS, "*.content")):
        rel = os.path.basename(cf).replace("__", "/").replace(".content", "")
        try:
            with open(cf, encoding="utf-8") as f:
                content = f.read()
            result = write_file(rel, content)
            if result == "written":
                written += 1
                os.remove(cf)
            else:
                skipped += 1
                os.remove(cf)
        except Exception as e:
            failed += 1
            failures.append({"path": rel, "error": str(e)})
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures}))


def flush_incoming():
    written = skipped = failed = 0
    failures = []
    for jf in sorted(glob.glob(os.path.join(INCOMING, "batch3_*.json"))):
        data = json.load(open(jf, encoding="utf-8"))
        for path, content in data.items():
            if content is None or str(content).startswith("Lovable API error"):
                failed += 1
                failures.append(path)
                continue
            result = write_file(path, content)
            if result == "written":
                written += 1
            else:
                skipped += 1
        os.remove(jf)
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures[:10]}))


def write_json(path):
    data = json.load(open(path, encoding="utf-8"))
    written = skipped = failed = 0
    failures = []
    for rel, content in data.items():
        result = write_file(rel, content)
        if result == "written":
            written += 1
        elif result == "skipped":
            skipped += 1
        else:
            failed += 1
            failures.append(rel)
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures}))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "status":
        status()
    elif cmd == "flush-reads":
        flush_reads()
    elif cmd == "flush-incoming":
        flush_incoming()
    elif cmd == "write-json" and len(sys.argv) > 2:
        write_json(sys.argv[2])
    else:
        print("Usage: batch3_export_helper.py [status|flush-reads|flush-incoming|write-json FILE]")
        sys.exit(1)
