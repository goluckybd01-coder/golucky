#!/usr/bin/env python3
"""
Batch 0 export runner helpers.
Usage:
  python3 auto_export_runner.py missing          # list paths not on disk
  python3 auto_export_runner.py status           # export summary
  python3 auto_export_runner.py write-json FILE  # write from {path: content} JSON
"""
import json, os, sys

WORKSPACE = "/workspace"
BATCH = "/workspace/.export-tmp/batch_0.json"


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


def main():
    paths = json.load(open(BATCH, encoding="utf-8"))
    if len(sys.argv) < 2:
        cmd = "status"
    else:
        cmd = sys.argv[1]

    if cmd == "missing":
        missing = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]
        print(json.dumps(missing))
        return

    if cmd == "status":
        on_disk = [p for p in paths if os.path.isfile(os.path.join(WORKSPACE, p))]
        missing = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]
        print(json.dumps({
            "total": len(paths),
            "exported": len(on_disk),
            "skipped": len(on_disk),
            "missing": len(missing),
            "failures": [],
        }, indent=2))
        return

    if cmd == "write-json" and len(sys.argv) >= 3:
        data = json.load(open(sys.argv[2], encoding="utf-8"))
        exported = skipped = 0
        failures = []
        for path, content in data.items():
            if path not in paths:
                continue
            if not content:
                failures.append(path)
                continue
            r = write_file(path, content)
            if r == "skipped":
                skipped += 1
            else:
                exported += 1
        print(json.dumps({"exported": exported, "skipped": skipped, "failures": failures}))
        return

    print(__doc__)


if __name__ == "__main__":
    main()
