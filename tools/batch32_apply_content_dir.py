#!/usr/bin/env python3
"""Apply all files from batch32_content/ via batch32_pipe_write (mcp_immediate_write)."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
PATHS_FILE = os.path.join(WORKSPACE, ".export-tmp/batch32_paths.json")
CONTENT = os.path.join(WORKSPACE, ".export-tmp/batch32_content")
PIPE = os.path.join(WORKSPACE, "tools/batch32_pipe_write.py")


def enc(rel: str) -> str:
    return rel.replace("/", "__")


def main():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    written = missing = failed = 0
    failures = []
    for rel in paths:
        cf = os.path.join(CONTENT, enc(rel))
        if not os.path.isfile(cf):
            missing += 1
            failures.append({"path": rel, "error": "missing content"})
            continue
        with open(cf, encoding="utf-8") as f:
            content = f.read()
        if not content.strip():
            failed += 1
            failures.append({"path": rel, "error": "empty"})
            continue
        r = subprocess.run(
            [sys.executable, PIPE, rel],
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
    print(json.dumps({"written": written, "missing": missing, "failed": failed, "total": len(paths), "failures": failures}))


if __name__ == "__main__":
    main()
