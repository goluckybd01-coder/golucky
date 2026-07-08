#!/usr/bin/env python3
"""Flush {path: content} chunk JSON via mcp_immediate_write.py"""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    chunk_path = sys.argv[1]
    mapping = json.load(open(chunk_path, encoding="utf-8"))
    written = skipped = failed = 0
    failures = []
    for path, content in mapping.items():
        if os.path.isfile(os.path.join(WORKSPACE, path)):
            skipped += 1
            continue
        try:
            if not content:
                raise ValueError("empty content")
            r = subprocess.run(
                ["python3", WRITE, path],
                input=content,
                text=True,
                capture_output=True,
            )
            if r.returncode != 0:
                raise RuntimeError((r.stderr or r.stdout).strip())
            written += 1
            print(r.stdout.strip())
        except Exception as e:
            failed += 1
            failures.append({"path": path, "error": str(e)})
            print(f"FAIL {path}: {e}", file=sys.stderr)
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures}))


if __name__ == "__main__":
    main()
