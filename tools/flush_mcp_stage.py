#!/usr/bin/env python3
"""Flush .export-tmp/mcp_stage/* via mcp_immediate_write.py"""
import json
import os
import subprocess
import sys

STAGE = "/workspace/.export-tmp/mcp_stage"
WRITE = "/workspace/tools/mcp_immediate_write.py"
WORKSPACE = "/workspace"


def main():
    written, failures = 0, []
    if not os.path.isdir(STAGE):
        print(json.dumps({"written": 0, "failed": 0, "failures": []}))
        return
    for name in sorted(os.listdir(STAGE)):
        stage = os.path.join(STAGE, name)
        if not os.path.isfile(stage):
            continue
        rel = name.replace("__", "/")
        with open(stage, encoding="utf-8") as f:
            content = f.read()
        proc = subprocess.run(
            [sys.executable, WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if proc.returncode != 0:
            failures.append({"path": rel, "error": (proc.stderr or proc.stdout).strip()})
        else:
            written += 1
            os.remove(stage)
            print(proc.stdout.strip())
    print(json.dumps({"written": written, "failed": len(failures), "failures": failures}))


if __name__ == "__main__":
    main()
