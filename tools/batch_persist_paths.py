#!/usr/bin/env python3
"""Write missing paths from mcp_incoming staging via mcp_immediate_write.py."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
INCOMING = "/workspace/.export-tmp/mcp_incoming"
WRITE = "/workspace/tools/mcp_immediate_write.py"


def enc(p: str) -> str:
    return p.replace("/", "__")


def main():
    paths = json.load(sys.stdin) if not sys.stdin.isatty() else json.load(open(sys.argv[1]))
    written, skipped, failures = 0, 0, []
    for rel in paths:
        full = os.path.join(WORKSPACE, rel)
        if os.path.isfile(full):
            skipped += 1
            continue
        stage = os.path.join(INCOMING, enc(rel))
        if not os.path.isfile(stage):
            failures.append({"path": rel, "error": "no staged content"})
            continue
        content = open(stage, encoding="utf-8").read()
        if not content.strip():
            failures.append({"path": rel, "error": "empty content"})
            continue
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
    print(json.dumps({"written": written, "skipped": skipped, "failed": len(failures), "failures": failures}))


if __name__ == "__main__":
    main()
