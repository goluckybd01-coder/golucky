#!/usr/bin/env python3
"""Flush JSONL batch: each line {"path":"...","content":"..."} via mcp_immediate_write.py"""
import json
import os
import subprocess
import sys

WRITE = "/workspace/tools/mcp_immediate_write.py"
WORKSPACE = "/workspace"


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "/workspace/.export-tmp/mcp_batch.jsonl"
    if not os.path.isfile(path):
        print(json.dumps({"written": 0, "failed": 0, "failures": []}))
        return
    written = 0
    failures = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            rel = obj["path"]
            content = obj["content"]
            if os.path.isfile(os.path.join(WORKSPACE, rel)):
                continue
            r = subprocess.run(
                ["python3", WRITE, rel],
                input=content,
                text=True,
                capture_output=True,
            )
            if r.returncode == 0:
                written += 1
                print(r.stdout.strip())
            else:
                failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
    print(json.dumps({"written": written, "failed": len(failures), "failures": failures}))


if __name__ == "__main__":
    main()
