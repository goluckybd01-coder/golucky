#!/usr/bin/env python3
"""Apply all staged batch32_incoming files via mcp_immediate_write, then flush staging."""
import json
import os
import shutil
import subprocess
import sys

WORKSPACE = "/workspace"
INCOMING = os.path.join(WORKSPACE, ".export-tmp/batch32_incoming")
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")
PATHS_FILE = os.path.join(WORKSPACE, ".export-tmp/batch32_paths.json")


def enc(rel: str) -> str:
    return rel.replace("/", "__")


def dec(name: str) -> str:
    return name.replace("__", "/")


def write_one(rel: str, content: str) -> str:
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout).strip())
    return r.stdout.strip()


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
        try:
            msg = write_one(rel, content)
            written += 1
            print(msg)
        except Exception as e:
            failures.append({"path": rel, "error": str(e)})
            failed += 1

    # Flush staging dir
    if os.path.isdir(INCOMING):
        shutil.rmtree(INCOMING)
        os.makedirs(INCOMING, exist_ok=True)

    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures}, indent=2))
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
