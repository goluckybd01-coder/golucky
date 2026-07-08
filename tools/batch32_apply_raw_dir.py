#!/usr/bin/env python3
"""Apply all files from .export-tmp/batch32_raw/ via batch32_write_from_file."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
RAW = os.path.join(WORKSPACE, ".export-tmp/batch32_raw")
WRITE_FROM_FILE = os.path.join(WORKSPACE, "tools/batch32_write_from_file.py")


def stage_to_rel(name: str) -> str:
    return name.replace("__", "/")


def main():
    if not os.path.isdir(RAW):
        print(json.dumps({"written": 0, "failed": 0, "error": "no raw dir"}))
        return 1
    written = failed = 0
    failures = []
    for name in sorted(os.listdir(RAW)):
        fp = os.path.join(RAW, name)
        if not os.path.isfile(fp):
            continue
        rel = stage_to_rel(name)
        r = subprocess.run(
            [sys.executable, WRITE_FROM_FILE, rel, fp],
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
