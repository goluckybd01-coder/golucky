#!/usr/bin/env python3
"""Flush fetched staging for slice 81-120 paths via mcp_immediate_write."""
import json
import os
import subprocess
import sys

STAGING = "/workspace/.export-tmp/fetched"
WRITE = "/workspace/tools/mcp_immediate_write.py"
WORKSPACE = "/workspace"
PATHS_FILE = "/workspace/.export-tmp/slice_81_120_paths.json"


def main():
    paths = set(json.load(open(PATHS_FILE, encoding="utf-8")))
    written, failures, skipped = 0, [], 0
    os.makedirs(STAGING, exist_ok=True)
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
