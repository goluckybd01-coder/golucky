#!/usr/bin/env python3
"""Flush staged MCP responses via mcp_immediate_write.py"""
import json
import os
import subprocess
import sys

STAGE = "/workspace/.export-tmp/mcp_responses"
WRITE = "/workspace/tools/mcp_immediate_write.py"
WORKSPACE = "/workspace"


def flush():
    written = failed = skipped = 0
    failures = []
    if not os.path.isdir(STAGE):
        print(json.dumps({"written": 0, "failed": 0, "skipped": 0, "failures": []}))
        return
    for name in sorted(os.listdir(STAGE)):
        src = os.path.join(STAGE, name)
        if not os.path.isfile(src):
            continue
        rel = name.replace("__", "/")
        dest = os.path.join(WORKSPACE, rel)
        if os.path.isfile(dest):
            os.remove(src)
            skipped += 1
            continue
        content = open(src, encoding="utf-8").read()
        r = subprocess.run(
            ["python3", WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode == 0:
            written += 1
            os.remove(src)
            print(r.stdout.strip())
        else:
            failed += 1
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
    print(json.dumps({"written": written, "failed": failed, "skipped": skipped, "failures": failures}))


if __name__ == "__main__":
    flush()
