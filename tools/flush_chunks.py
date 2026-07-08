#!/usr/bin/env python3
"""Flush .export-tmp/chunks/* via mcp_immediate_write.py. Chunk names use __ for /."""
import json
import os
import subprocess
import sys

CHUNKS = "/workspace/.export-tmp/chunks"
WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    written, failures = 0, []
    if not os.path.isdir(CHUNKS):
        print(json.dumps({"written": 0, "failed": 0, "failures": [], "note": "no chunks dir"}))
        return
    for name in sorted(os.listdir(CHUNKS)):
        path = os.path.join(CHUNKS, name)
        if not os.path.isfile(path):
            continue
        rel = name.replace("__", "/")
        with open(path, encoding="utf-8") as f:
            content = f.read()
        proc = subprocess.run(
            [sys.executable, WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if proc.returncode:
            failures.append({"path": rel, "error": (proc.stderr or proc.stdout).strip()})
        else:
            written += 1
            print(proc.stdout.strip())
            os.remove(path)
    print(json.dumps({"written": written, "failed": len(failures), "failures": failures}))


if __name__ == "__main__":
    main()
