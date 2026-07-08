#!/usr/bin/env python3
"""Flush .export-tmp/batch32_incoming/* via mcp_immediate_write.py."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
INCOMING = os.path.join(WORKSPACE, ".export-tmp/batch32_incoming")
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")


def stage_to_rel(name: str) -> str:
    return name.replace("__", "/")


def main():
    if not os.path.isdir(INCOMING):
        print(json.dumps({"written": 0, "failed": 0, "error": "no incoming dir"}))
        return
    written = failed = 0
    failures = []
    for name in sorted(os.listdir(INCOMING)):
        fp = os.path.join(INCOMING, name)
        if not os.path.isfile(fp):
            continue
        rel = stage_to_rel(name)
        with open(fp, encoding="utf-8") as f:
            content = f.read()
        if not content.strip():
            failed += 1
            failures.append({"path": rel, "error": "empty"})
            continue
        r = subprocess.run(
            [sys.executable, WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode != 0:
            failed += 1
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
        else:
            written += 1
            print(r.stdout.strip())
    print(json.dumps({"written": written, "failed": failed, "failures": failures}, indent=2))


if __name__ == "__main__":
    main()
