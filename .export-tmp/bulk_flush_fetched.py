#!/usr/bin/env python3
"""For each missing path in batch_40_80, if fetched/<enc> exists, write via mcp_immediate_write.py"""
import json
import os
import subprocess

WORKSPACE = "/workspace"
FETCHED = "/workspace/.export-tmp/fetched"
WRITE = "/workspace/tools/mcp_immediate_write.py"
BATCH = "/workspace/.export-tmp/batch_40_80.json"


def enc(p):
    return p.replace("/", "__")


def main():
    paths = json.load(open(BATCH))
    missing = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]
    written = 0
    failures = []
    for rel in missing:
        stage = os.path.join(FETCHED, enc(rel))
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
    still_missing = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]
    print(json.dumps({
        "written": written,
        "failed": len(failures),
        "failures": failures,
        "still_missing": len(still_missing),
    }))


if __name__ == "__main__":
    main()
