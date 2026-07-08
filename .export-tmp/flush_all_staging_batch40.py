#!/usr/bin/env python3
"""Flush every file in staging_batch40 to workspace via mcp_immediate_write."""
import os
import subprocess
import sys

STAGING = "/workspace/.export-tmp/staging_batch40"
WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    written = []
    failed = []
    for name in sorted(os.listdir(STAGING)):
        stage = os.path.join(STAGING, name)
        if not os.path.isfile(stage):
            continue
        rel = name.replace("__", "/")
        content = open(stage, encoding="utf-8").read()
        if not content.strip():
            failed.append({"path": rel, "error": "empty"})
            continue
        r = subprocess.run(
            [sys.executable, WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode:
            failed.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
        else:
            written.append(rel)
            print(r.stdout.strip())
    print(f"WRITTEN={len(written)} FAILED={len(failed)}")
    for p in written:
        print(f"OK {p}")
    for f in failed:
        print(f"FAIL {f['path']}: {f['error']}", file=sys.stderr)


if __name__ == "__main__":
    main()
