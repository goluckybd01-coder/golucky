#!/usr/bin/env python3
"""Write all files from .export-tmp/batch32_incoming via mcp_immediate_write.py."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
INCOMING = os.path.join(WORKSPACE, ".export-tmp/batch32_incoming")
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")
PATHS_FILE = os.path.join(WORKSPACE, ".export-tmp/batch32_paths.json")


def enc(rel: str) -> str:
    return rel.replace("/", "__")


def write_one(rel: str, content: str) -> tuple[bool, str]:
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        return False, (r.stderr or r.stdout).strip()
    return True, r.stdout.strip()


def main():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    written = skipped = failed = 0
    failures = []
    for rel in paths:
        stage = os.path.join(INCOMING, enc(rel))
        if not os.path.isfile(stage):
            failures.append({"path": rel, "error": "not staged"})
            failed += 1
            continue
        with open(stage, encoding="utf-8") as f:
            content = f.read()
        if not content.strip():
            failures.append({"path": rel, "error": "empty"})
            failed += 1
            continue
        ok, msg = write_one(rel, content)
        if ok:
            written += 1
            print(msg)
        else:
            failed += 1
            failures.append({"path": rel, "error": msg})
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures}, indent=2))


if __name__ == "__main__":
    main()
