#!/usr/bin/env python3
"""Flush reads/*.content for batch_40_80 paths via mcp_immediate_write."""
import glob
import json
import os
import subprocess
import sys

READS = "/workspace/.export-tmp/reads"
WRITE = "/workspace/tools/mcp_immediate_write.py"
WORKSPACE = "/workspace"
PATHS_FILE = "/workspace/.export-tmp/batch_40_80.json"


def main():
    paths = set(json.load(open(PATHS_FILE, encoding="utf-8")))
    written = skipped = 0
    failures = []
    for cf in sorted(glob.glob(os.path.join(READS, "*.content"))):
        rel = os.path.basename(cf).replace("__", "/").replace(".content", "")
        if rel not in paths:
            continue
        full = os.path.join(WORKSPACE, rel)
        if os.path.isfile(full):
            skipped += 1
            os.remove(cf)
            continue
        with open(cf, encoding="utf-8") as f:
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
            os.remove(cf)
    still = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]
    print(json.dumps({"written": written, "skipped": skipped, "failed": len(failures), "failures": failures, "still_missing": still}))


if __name__ == "__main__":
    main()
