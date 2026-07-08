#!/usr/bin/env python3
"""Write all files from staging dir via mcp_immediate_write.py. Staging names use __ for /."""
import json
import os
import subprocess
import sys

STAGING = "/workspace/.export-tmp/fetched"
WRITE = "/workspace/tools/mcp_immediate_write.py"
WORKSPACE = "/workspace"


def main():
    batch_file = sys.argv[1] if len(sys.argv) > 1 else "/workspace/.export-tmp/batch_40_80.json"
    paths = set(json.load(open(batch_file, encoding="utf-8")))
    written = 0
    failures = []
    if not os.path.isdir(STAGING):
        os.makedirs(STAGING, exist_ok=True)
    for name in sorted(os.listdir(STAGING)):
        rel = name.replace("__", "/")
        if rel not in paths:
            continue
        stage = os.path.join(STAGING, name)
        if not os.path.isfile(stage):
            continue
        if os.path.isfile(os.path.join(WORKSPACE, rel)):
            os.remove(stage)
            continue
        with open(stage, encoding="utf-8") as f:
            content = f.read()
        r = subprocess.run(
            ["python3", WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode == 0:
            written += 1
            os.remove(stage)
            print(r.stdout.strip())
        else:
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
    still = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]
    print(json.dumps({
        "written": written,
        "failed": len(failures),
        "failures": failures,
        "still_missing": len(still),
        "still_missing_paths": still,
    }))


if __name__ == "__main__":
    main()
