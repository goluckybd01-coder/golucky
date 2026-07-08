#!/usr/bin/env python3
"""Export batch_40_80 missing paths: stage JSON chunk -> mcp_immediate_write."""
import json
import os
import subprocess
import sys

WRITE = "/workspace/tools/mcp_immediate_write.py"
WORKSPACE = "/workspace"
PATHS_FILE = "/workspace/.export-tmp/batch_40_80.json"


def missing_paths():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    return [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]


def flush_chunk(chunk_path: str):
    data = json.load(open(chunk_path, encoding="utf-8"))
    written = skipped = 0
    failures = []
    for rel, content in data.items():
        full = os.path.join(WORKSPACE, rel)
        if os.path.isfile(full):
            skipped += 1
            continue
        if not content:
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


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"missing": missing_paths(), "count": len(missing_paths())}))
        return
    flush_chunk(sys.argv[1])


if __name__ == "__main__":
    main()
