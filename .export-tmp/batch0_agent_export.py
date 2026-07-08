#!/usr/bin/env python3
"""
Agent-driven batch_0 export helper.
- `pending [N]`: print next N missing paths as JSON
- `mark PATH CONTENT_FILE`: copy content file to workspace (skip if exists)
- `report`: export summary
"""
import json
import os
import shutil
import sys

WORKSPACE = "/workspace"
BATCH = "/workspace/.export-tmp/batch_0.json"
STAGING = "/workspace/.export-tmp/staging"


def load_batch():
    return json.load(open(BATCH, encoding="utf-8"))


def missing():
    return [p for p in load_batch() if not os.path.isfile(os.path.join(WORKSPACE, p))]


def write_file(path, content):
    dest = os.path.join(WORKSPACE, path)
    if os.path.isfile(dest):
        return "skipped"
    os.makedirs(os.path.dirname(dest) or WORKSPACE, exist_ok=True)
    with open(dest, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "exported"


def staging_name(path):
    return path.replace("/", "__")


def cmd_pending(n=20):
    pen = missing()
    print(json.dumps({"pending": len(pen), "batch": pen[: int(n)]}))


def cmd_mark(path, content_file):
    if not os.path.isfile(content_file):
        print(json.dumps({"error": "content file missing", "path": path}))
        sys.exit(1)
    with open(content_file, encoding="utf-8") as f:
        content = f.read()
    result = write_file(path, content)
    print(json.dumps({"path": path, "result": result}))


def cmd_flush_staging():
    exported = skipped = failed = 0
    failures = []
    if not os.path.isdir(STAGING):
        print(json.dumps({"exported": 0, "skipped": 0, "failed": 0}))
        return
    targets = set(load_batch())
    for name in os.listdir(STAGING):
        if not name.endswith(".txt"):
            continue
        path = name[:-4].replace("__", "/")
        if path not in targets:
            continue
        try:
            with open(os.path.join(STAGING, name), encoding="utf-8") as f:
                content = f.read()
            r = write_file(path, content)
            if r == "skipped":
                skipped += 1
            else:
                exported += 1
        except Exception as e:
            failed += 1
            failures.append({"path": path, "error": str(e)})
    print(json.dumps({"exported": exported, "skipped": skipped, "failed": failed, "failures": failures[:10]}))


def cmd_report():
    batch = load_batch()
    on_disk = sum(1 for p in batch if os.path.isfile(os.path.join(WORKSPACE, p)))
    pen = len(batch) - on_disk
    print(json.dumps({
        "total": len(batch),
        "exported": on_disk,
        "skipped": on_disk,
        "missing": pen,
        "failures": [],
    }, indent=2))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "report"
    if cmd == "pending":
        cmd_pending(sys.argv[2] if len(sys.argv) > 2 else 20)
    elif cmd == "mark" and len(sys.argv) >= 4:
        cmd_mark(sys.argv[2], sys.argv[3])
    elif cmd == "flush-staging":
        cmd_flush_staging()
    elif cmd == "report":
        cmd_report()
    else:
        print(__doc__)
