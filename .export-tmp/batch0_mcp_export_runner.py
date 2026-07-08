#!/usr/bin/env python3
"""Batch 0 export runner for Lovable MCP agent workflow."""
import json
import os
import sys

WORKSPACE = "/workspace"
BATCH_FILE = "/workspace/.export-tmp/batch_0.json"
INCOMING_DIR = "/workspace/.export-tmp/incoming"


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
    print(json.dumps({"pending": len(pen), "batch": pen[: int(n)]}))


def cmd_apply_json(path):
    data = json.load(open(path, encoding="utf-8"))
    written = skipped = failed = 0
    failures = []
    for rel, content in data.items():
        if not content or str(content).startswith("Lovable API error"):
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
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures}))


def cmd_flush_incoming():
    written = skipped = failed = 0
    failures = []
    if not os.path.isdir(INCOMING_DIR):
        print(json.dumps({"written": 0, "skipped": 0, "failed": 0, "failures": []}))
        return
    for name in sorted(os.listdir(INCOMING_DIR)):
        if not name.endswith(".json"):
            continue
        path = os.path.join(INCOMING_DIR, name)
        try:
            data = json.load(open(path, encoding="utf-8"))
        except Exception as e:
            failures.append({"file": name, "error": str(e)})
            failed += 1
            continue
        for rel, content in data.items():
            if not content:
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
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures[:20]}))


def cmd_report():
    batch = load_batch()
    existing = [p for p in batch if os.path.isfile(os.path.join(WORKSPACE, p))]
    pen = missing()
    print(json.dumps({
        "total": len(batch),
        "exported": len(existing),
        "skipped": len(existing),
        "missing": len(pen),
        "failures": [],
    }, indent=2))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "report"
    if cmd == "next":
        cmd_next(sys.argv[2] if len(sys.argv) > 2 else 20)
    elif cmd == "apply-json" and len(sys.argv) > 2:
        cmd_apply_json(sys.argv[2])
    elif cmd == "flush-incoming":
        cmd_flush_incoming()
    elif cmd == "report":
        cmd_report()
    else:
        print("Usage: batch0_mcp_export_runner.py [next N|apply-json FILE|flush-incoming|report]")
        sys.exit(1)
