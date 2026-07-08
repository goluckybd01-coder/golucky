#!/usr/bin/env python3
"""
Agent-driven batch 3 export runner.
- next: print missing paths (optionally limited)
- apply-json FILE: write path->content dict, skip existing
- report: final counts for batch_3.json
"""
import json
import os
import sys

WORKSPACE = "/workspace"
BATCH_FILE = "/workspace/.export-tmp/batch_3.json"


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


def cmd_next(n=20):
    pen = missing()
    batch = pen[: int(n)]
    print(json.dumps({"pending": len(pen), "batch": batch}))


def cmd_apply_json(path):
    data = json.load(open(path, encoding="utf-8"))
    written = skipped = failed = 0
    failures = []
    for rel, content in data.items():
        if content is None or str(content).startswith("Lovable API error"):
            failed += 1
            failures.append(rel)
            continue
        try:
            r = write_file(rel, content)
            if r == "written":
                written += 1
            else:
                skipped += 1
        except Exception as e:
            failed += 1
            failures.append({"path": rel, "error": str(e)})
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures[:10]}))


def cmd_report():
    batch = load_batch()
    existing = [p for p in batch if os.path.isfile(os.path.join(WORKSPACE, p))]
    pen = missing()
    print(json.dumps({
        "total": len(batch),
        "written": len(existing),
        "skipped": len(existing),
        "missing": len(pen),
        "failed": 0,
        "failures": [],
    }))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "report"
    if cmd == "next":
        cmd_next(sys.argv[2] if len(sys.argv) > 2 else 20)
    elif cmd == "apply-json" and len(sys.argv) > 2:
        cmd_apply_json(sys.argv[2])
    elif cmd == "report":
        cmd_report()
    else:
        print("Usage: batch3_mcp_export_runner.py [next N|apply-json FILE|report]")
        sys.exit(1)
