#!/usr/bin/env python3
"""Flush .export-tmp/tmp_export/* via mcp_immediate_write.py"""
import glob
import json
import os
import subprocess

TMP = "/workspace/.export-tmp/tmp_export"
WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    os.makedirs(TMP, exist_ok=True)
    written = 0
    failures = []
    for stage in sorted(glob.glob(os.path.join(TMP, "*"))):
        if not os.path.isfile(stage):
            continue
        rel = os.path.basename(stage).replace("__", "/")
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
