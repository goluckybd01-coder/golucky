#!/usr/bin/env python3
"""Flush .export-tmp/staging/* via mcp_immediate_write.py. Filenames use __ for /."""
import json
import os
import subprocess
import sys

STAGING = "/workspace/.export-tmp/staging"
WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    written, failed, failures = 0, 0, []
    if not os.path.isdir(STAGING):
        print(json.dumps({"written": 0, "failed": 0, "failures": []}))
        return
    for name in sorted(os.listdir(STAGING)):
        stage_path = os.path.join(STAGING, name)
        if not os.path.isfile(stage_path):
            continue
        rel = name.replace("__", "/")
        content = open(stage_path, encoding="utf-8").read()
        proc = subprocess.run(
            [sys.executable, WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if proc.returncode != 0:
            failed += 1
            failures.append({"path": rel, "error": (proc.stderr or proc.stdout).strip()})
        else:
            written += 1
            os.remove(stage_path)
            print(proc.stdout.strip())
    print(json.dumps({"written": written, "failed": failed, "failures": failures}))


if __name__ == "__main__":
    main()
