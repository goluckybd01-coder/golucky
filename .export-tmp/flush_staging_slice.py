#!/usr/bin/env python3
"""Flush staging dir to workspace via mcp_immediate_write for batch_40_80 paths."""
import json
import os
import subprocess
import sys

STAGING = "/workspace/.export-tmp/staging"
WRITE = "/workspace/tools/mcp_immediate_write.py"
WORKSPACE = "/workspace"
PATHS_FILE = "/workspace/.export-tmp/batch_40_80.json"


def main():
    paths = set(json.load(open(PATHS_FILE, encoding="utf-8")))
    written = skipped = 0
    failures = []
    if not os.path.isdir(STAGING):
        print(json.dumps({"written": 0, "skipped": 0, "failures": [], "error": "no staging dir"}))
        return
    for name in sorted(os.listdir(STAGING)):
        rel = name.replace("__", "/")
        if rel not in paths:
            continue
        full = os.path.join(WORKSPACE, rel)
        if os.path.isfile(full):
            skipped += 1
            continue
        stage = os.path.join(STAGING, name)
        with open(stage, encoding="utf-8") as f:
            content = f.read()
        if not content:
            failures.append({"path": rel, "error": "empty staging file"})
            continue
        proc = subprocess.run(
            [sys.executable, WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if proc.returncode:
            failures.append({"path": rel, "error": (proc.stderr or proc.stdout).strip()})
        else:
            written += 1
            print(proc.stdout.strip())
    still = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]
    print(json.dumps({"written": written, "skipped": skipped, "failed": len(failures), "failures": failures, "still_missing": still}))


if __name__ == "__main__":
    main()
