#!/usr/bin/env python3
"""Apply all batch32 paths from disk via mcp_immediate_write + stage to batch32_incoming."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
PATHS_FILE = os.path.join(WORKSPACE, ".export-tmp/batch32_paths.json")
STAGE = os.path.join(WORKSPACE, "tools/batch32_stage_and_write.py")


def main():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    written = skipped = failed = 0
    failures = []
    for rel in paths:
        full = os.path.join(WORKSPACE, rel)
        if not os.path.isfile(full):
            failed += 1
            failures.append({"path": rel, "error": "not on disk"})
            continue
        with open(full, encoding="utf-8") as f:
            content = f.read()
        if not content.strip():
            failed += 1
            failures.append({"path": rel, "error": "empty"})
            continue
        r = subprocess.run(
            [sys.executable, STAGE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode != 0:
            failed += 1
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
        else:
            written += 1
            print(r.stdout.strip())
    print(json.dumps({
        "written": written,
        "skipped": skipped,
        "failed": failed,
        "failures": failures,
    }, indent=2))
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
