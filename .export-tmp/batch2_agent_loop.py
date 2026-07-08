#!/usr/bin/env python3
"""Batch 2 agent loop: stage reads/ and incoming JSON -> workspace."""
import glob
import json
import os
import sys

WORKSPACE = "/workspace"
BATCH_FILE = "/workspace/.export-tmp/batch_2.json"
READS = "/workspace/.export-tmp/reads"
INCOMING = "/workspace/.export-tmp/incoming"


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


def path_to_read_name(rel):
    return rel.replace("/", "__") + ".content"


def read_name_to_path(name):
    return name.replace(".content", "").replace("__", "/")


def flush_reads():
    written = skipped = failed = 0
    failures = []
    os.makedirs(READS, exist_ok=True)
    for cf in sorted(glob.glob(os.path.join(READS, "*.content"))):
        rel = read_name_to_path(os.path.basename(cf))
        try:
            with open(cf, encoding="utf-8") as f:
                content = f.read()
            r = write_file(rel, content)
            if r == "written":
                written += 1
                os.remove(cf)
            else:
                skipped += 1
        except Exception as e:
            failed += 1
            failures.append({"path": rel, "error": str(e)})
    return {"written": written, "skipped": skipped, "failed": failed, "failures": failures}


def flush_incoming():
    written = skipped = failed = 0
    failures = []
    os.makedirs(INCOMING, exist_ok=True)
    for jf in sorted(glob.glob(os.path.join(INCOMING, "batch2_*.json"))):
        data = json.load(open(jf, encoding="utf-8"))
        for path, content in data.items():
            if content is None:
                failed += 1
                failures.append(path)
                continue
            r = write_file(path, content)
            if r == "written":
                written += 1
            else:
                skipped += 1
        os.remove(jf)
    return {"written": written, "skipped": skipped, "failed": failed, "failures": failures[:10]}


def report():
    batch = load_batch()
    existing = [p for p in batch if os.path.isfile(os.path.join(WORKSPACE, p))]
    pen = missing()
    staged = len(glob.glob(os.path.join(READS, "*.content")))
    incoming = len(glob.glob(os.path.join(INCOMING, "batch2_*.json")))
    print(json.dumps({
        "total": len(batch),
        "written": len(existing),
        "skipped": len(existing),
        "missing": len(pen),
        "failed": 0,
        "staged_reads": staged,
        "incoming_batches": incoming,
    }))


def needs_fetch(n=20):
    pen = missing()
    print(json.dumps({"pending": len(pen), "batch": pen[: int(n)]}))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "report"
    if cmd == "report":
        report()
    elif cmd == "needs-fetch":
        needs_fetch(sys.argv[2] if len(sys.argv) > 2 else 20)
    elif cmd == "apply-reads":
        print(json.dumps(flush_reads()))
    elif cmd == "apply-incoming":
        print(json.dumps(flush_incoming()))
    elif cmd == "flush-all":
        r1 = flush_reads()
        r2 = flush_incoming()
        print(json.dumps({"reads": r1, "incoming": r2}))
    elif cmd == "apply-json" and len(sys.argv) > 2:
        data = json.load(open(sys.argv[2], encoding="utf-8"))
        w = s = f = 0
        failures = []
        for rel, content in data.items():
            if content is None:
                f += 1
                failures.append(rel)
                continue
            r = write_file(rel, content)
            if r == "written":
                w += 1
            else:
                s += 1
        print(json.dumps({"written": w, "skipped": s, "failed": f, "failures": failures}))
    else:
        print("Usage: batch2_agent_loop.py [report|needs-fetch N|apply-reads|apply-incoming|flush-all|apply-json FILE]")
        sys.exit(1)
