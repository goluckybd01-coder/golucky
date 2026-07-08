#!/usr/bin/env python3
"""Apply all batch32 paths from batch32_raw/ via mcp_immediate_write."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
RAW = os.path.join(WORKSPACE, ".export-tmp/batch32_raw")
PATHS_FILE = os.path.join(WORKSPACE, ".export-tmp/batch32_paths.json")
WRITE_FROM_FILE = os.path.join(WORKSPACE, "tools/batch32_write_from_file.py")


def main():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    os.makedirs(RAW, exist_ok=True)
    written = failed = 0
    failures = []
    for rel in paths:
        enc = rel.replace("/", "__")
        raw = os.path.join(RAW, enc)
        if not os.path.isfile(raw):
            failures.append({"path": rel, "error": "no raw file"})
            failed += 1
            continue
        r = subprocess.run(
            [sys.executable, WRITE_FROM_FILE, rel, raw],
            capture_output=True,
            text=True,
        )
        if r.returncode == 0:
            written += 1
            print(r.stdout.strip())
        else:
            failed += 1
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
    print(json.dumps({"written": written, "failed": failed, "failures": failures}, indent=2))
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
