#!/usr/bin/env python3
"""Write files from JSON dict {rel-path: content} via mcp_immediate_write."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    written = skipped = failed = 0
    failures = []
    for rel, content in data.items():
        full = os.path.join(WORKSPACE, rel)
        if os.path.isfile(full):
            skipped += 1
            continue
        if not content or not str(content).strip():
            failures.append({"path": rel, "error": "empty content"})
            failed += 1
            continue
        r = subprocess.run(
            [sys.executable, WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode:
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
            failed += 1
        else:
            written += 1
            print(r.stdout.strip())
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures}))


if __name__ == "__main__":
    main()
