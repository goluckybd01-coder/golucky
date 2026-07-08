#!/usr/bin/env python3
"""Export remaining slice files: read staged content, pipe to mcp_immediate_write."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
WRITE = "/workspace/tools/mcp_immediate_write.py"
CONTENT_JSON = "/workspace/.export-tmp/slice_81_120_content.json"
PATHS_FILE = "/workspace/.export-tmp/slice_81_120_paths.json"


def main():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    contents = {}
    if os.path.isfile(CONTENT_JSON):
        contents = json.load(open(CONTENT_JSON, encoding="utf-8"))
    written, failures, skipped = 0, [], 0
    for path in paths:
        full = os.path.join(WORKSPACE, path)
        if os.path.isfile(full):
            skipped += 1
            continue
        content = contents.get(path)
        if not content:
            failures.append({"path": path, "error": "no content in batch json"})
            continue
        proc = subprocess.run(
            [sys.executable, WRITE, path],
            input=content,
            text=True,
            capture_output=True,
        )
        if proc.returncode:
            failures.append({"path": path, "error": (proc.stderr or proc.stdout).strip()})
        else:
            written += 1
            print(proc.stdout.strip())
    print(json.dumps({"written": written, "skipped": skipped, "failed": len(failures), "failures": failures}))


if __name__ == "__main__":
    main()
