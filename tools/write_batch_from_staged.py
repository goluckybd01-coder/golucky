#!/usr/bin/env python3
"""Write all staged + direct content files for slice 81-120 export."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
WRITE = "/workspace/tools/mcp_immediate_write.py"
STAGE = "/workspace/.export-tmp/staged"
PATHS_FILE = "/workspace/.export-tmp/slice_81_120_paths.json"


def write_path(path: str, content: str) -> tuple[bool, str]:
    proc = subprocess.run(
        [sys.executable, WRITE, path],
        input=content,
        text=True,
        capture_output=True,
    )
    if proc.returncode:
        return False, (proc.stderr or proc.stdout).strip()
    return True, proc.stdout.strip()


def main():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    written, failures, skipped = 0, [], 0
    for path in paths:
        full = os.path.join(WORKSPACE, path)
        if os.path.isfile(full):
            skipped += 1
            continue
        stage_path = os.path.join(STAGE, path)
        if os.path.isfile(stage_path):
            with open(stage_path, encoding="utf-8") as f:
                content = f.read()
        else:
            failures.append({"path": path, "error": "no staged content"})
            continue
        ok, msg = write_path(path, content)
        if ok:
            written += 1
            print(msg)
        else:
            failures.append({"path": path, "error": msg})
    result = {"written": written, "skipped": skipped, "failed": len(failures), "failures": failures}
    print(json.dumps(result))


if __name__ == "__main__":
    main()
