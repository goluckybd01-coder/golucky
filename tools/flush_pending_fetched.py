#!/usr/bin/env python3
"""Flush pending src paths from .export-tmp/fetched/ via mcp_immediate_write.py."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"
FETCHED = "/workspace/.export-tmp/fetched"
WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    data = json.load(open(PENDING, encoding="utf-8"))
    paths = data.get("pending_src_paths", [])[:40]
    missing = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]

    written = skipped = failed = 0
    failures = []

    for rel in missing:
        stage = os.path.join(FETCHED, rel.replace("/", "__"))
        if not os.path.isfile(stage):
            failures.append({"path": rel, "error": "not staged in fetched/"})
            failed += 1
            continue
        with open(stage, encoding="utf-8") as f:
            content = f.read()
        if not content.strip():
            failures.append({"path": rel, "error": "empty staged content"})
            failed += 1
            continue
        r = subprocess.run(
            [sys.executable, WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode:
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
            failed += 1
        else:
            written += 1
            print(r.stdout.strip())

    still = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]
    print(json.dumps({
        "written": written,
        "skipped": skipped,
        "failed": failed,
        "failures": failures,
        "still_missing": len(still),
        "still_missing_paths": still,
    }, indent=2))


if __name__ == "__main__":
    main()
