#!/usr/bin/env python3
"""Apply all batch32 paths from .export-tmp/batch32_contents/ via mcp_immediate_write."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
PATHS_FILE = os.path.join(WORKSPACE, ".export-tmp/batch32_paths.json")
CONTENTS = os.path.join(WORKSPACE, ".export-tmp/batch32_contents")
INCOMING = os.path.join(WORKSPACE, ".export-tmp/batch32_incoming")
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")


def main():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    os.makedirs(CONTENTS, exist_ok=True)
    os.makedirs(INCOMING, exist_ok=True)
    written = failed = 0
    failures = []
    for rel in paths:
        enc = rel.replace("/", "__")
        src = os.path.join(CONTENTS, enc)
        if not os.path.isfile(src):
            failed += 1
            failures.append({"path": rel, "error": "not in batch32_contents"})
            continue
        with open(src, encoding="utf-8") as f:
            content = f.read()
        if not content.strip():
            failed += 1
            failures.append({"path": rel, "error": "empty"})
            continue
        stage = os.path.join(INCOMING, enc)
        with open(stage, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
            if not content.endswith("\n"):
                f.write("\n")
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
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
