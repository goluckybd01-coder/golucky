#!/usr/bin/env python3
"""Write batch JSON [{path, content}] via mcp_immediate_write.py"""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    batch_path = sys.argv[1] if len(sys.argv) > 1 else "/workspace/.export-tmp/slice40_batch.json"
    items = json.load(open(batch_path, encoding="utf-8"))
    written = skipped = failed = 0
    failures = []
    for item in items:
        rel = item.get("path")
        content = item.get("content")
        if not rel:
            continue
        full = os.path.join(WORKSPACE, rel)
        if os.path.isfile(full):
            skipped += 1
            continue
        if content is None or not str(content).strip():
            failures.append({"path": rel, "error": item.get("error", "no content")})
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
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures}, indent=2))


if __name__ == "__main__":
    main()
