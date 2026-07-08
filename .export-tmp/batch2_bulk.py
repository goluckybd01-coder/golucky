#!/usr/bin/env python3
"""Bulk export batch_2 pending files via agent MCP reads -> reads/ -> workspace."""
import json
import os
import sys

WORKSPACE = "/workspace"
BATCH_FILE = "/workspace/.export-tmp/batch_2.json"
READS = "/workspace/.export-tmp/reads"


def path_to_name(rel: str) -> str:
    return rel.replace("/", "__") + ".content"


def name_to_path(name: str) -> str:
    return name.replace(".content", "").replace("__", "/")


def pending():
    batch = json.load(open(BATCH_FILE, encoding="utf-8"))
    return [p for p in batch if not os.path.isfile(os.path.join(WORKSPACE, p))]


def stage_content(rel: str, content: str) -> dict:
    if not content or content.startswith("Lovable API error"):
        return {"path": rel, "result": "failed", "error": "empty or error content"}
    os.makedirs(READS, exist_ok=True)
    cf = os.path.join(READS, path_to_name(rel))
    with open(cf, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return {"path": rel, "result": "staged", "bytes": len(content)}


def write_file(rel: str, content: str) -> str:
    full = os.path.join(WORKSPACE, rel)
    if os.path.isfile(full):
        return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"


def flush_reads():
    written = skipped = failed = 0
    failures = []
    os.makedirs(READS, exist_ok=True)
    for cf in sorted(f for f in os.listdir(READS) if f.endswith(".content")):
        rel = name_to_path(cf)
        try:
            with open(os.path.join(READS, cf), encoding="utf-8") as f:
                content = f.read()
            r = write_file(rel, content)
            if r == "written":
                written += 1
                os.remove(os.path.join(READS, cf))
            else:
                skipped += 1
                os.remove(os.path.join(READS, cf))
        except Exception as e:
            failed += 1
            failures.append({"path": rel, "error": str(e)})
    return {"written": written, "skipped": skipped, "failed": failed, "failures": failures}


def apply_json(path: str):
    data = json.load(open(path, encoding="utf-8"))
    written = skipped = failed = 0
    failures = []
    for rel, content in data.items():
        if content is None or str(content).startswith("Lovable API error"):
            failed += 1
            failures.append(rel)
            continue
        r = write_file(rel, content)
        if r == "written":
            written += 1
        elif r == "skipped":
            skipped += 1
    return {"written": written, "skipped": skipped, "failed": failed, "failures": failures}


def report():
    batch = json.load(open(BATCH_FILE, encoding="utf-8"))
    existing = [p for p in batch if os.path.isfile(os.path.join(WORKSPACE, p))]
    pen = [p for p in batch if p not in existing]
    staged = len([f for f in os.listdir(READS) if f.endswith(".content")]) if os.path.isdir(READS) else 0
    return {
        "total": len(batch),
        "written": len(existing),
        "skipped": len(existing),
        "pending": len(pen),
        "failed": 0,
        "staged_reads": staged,
    }


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "report"
    if cmd == "report":
        print(json.dumps(report()))
    elif cmd == "pending":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 999
        pen = pending()
        print(json.dumps({"pending": len(pen), "batch": pen[:n]}))
    elif cmd == "stage-stdin" and len(sys.argv) > 2:
        print(json.dumps(stage_content(sys.argv[2], sys.stdin.read())))
    elif cmd == "flush":
        print(json.dumps(flush_reads()))
    elif cmd == "apply-json" and len(sys.argv) > 2:
        print(json.dumps(apply_json(sys.argv[2])))
    else:
        print("Usage: batch2_bulk.py [report|pending N|stage-stdin PATH|flush|apply-json FILE]")
        sys.exit(1)
