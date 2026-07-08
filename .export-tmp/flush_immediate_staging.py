#!/usr/bin/env python3
"""Flush mcp_responses staging via mcp_immediate_write.py"""
import json
import os
import subprocess
import sys

SRC = "/workspace/.export-tmp/mcp_responses"
WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    paths = sys.argv[1:] if len(sys.argv) > 1 else None
    written = 0
    failures = []
    names = sorted(os.listdir(SRC)) if os.path.isdir(SRC) else []
    for name in names:
        rel = name.replace("__", "/")
        if paths and rel not in paths:
            continue
        stage = os.path.join(SRC, name)
        if not os.path.isfile(stage):
            continue
        with open(stage, encoding="utf-8") as f:
            content = f.read()
        r = subprocess.run(
            ["python3", WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode == 0:
            written += 1
            os.remove(stage)
            print(r.stdout.strip())
        else:
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
    print(json.dumps({"written": written, "failed": len(failures), "failures": failures}))


if __name__ == "__main__":
    main()
