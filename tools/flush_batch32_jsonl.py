#!/usr/bin/env python3
"""Flush .export-tmp/batch32.jsonl via batch32_pipe_write (mcp_immediate_write)."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
JSONL = os.path.join(WORKSPACE, ".export-tmp/batch32.jsonl")
PIPE = os.path.join(WORKSPACE, "tools/batch32_pipe_write.py")


def main():
    if not os.path.isfile(JSONL):
        print(json.dumps({"written": 0, "failed": 0, "error": "no jsonl"}))
        return
    written = failed = 0
    failures = []
    seen = set()
    with open(JSONL, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            item = json.loads(line)
            rel = item["path"]
            if rel in seen:
                continue
            seen.add(rel)
            content = item.get("content", "")
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
    print(json.dumps({"written": written, "failed": failed, "unique": len(seen), "failures": failures}))


if __name__ == "__main__":
    main()
