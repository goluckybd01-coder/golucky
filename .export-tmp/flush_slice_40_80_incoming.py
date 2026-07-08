#!/usr/bin/env python3
"""Write batch_40_80 missing files from mcp_incoming via mcp_immediate_write."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
INCOMING = "/workspace/.export-tmp/mcp_incoming"
WRITE = "/workspace/tools/mcp_immediate_write.py"
PATHS_FILE = "/workspace/.export-tmp/batch_40_80.json"


def main():
    paths = set(json.load(open(PATHS_FILE, encoding="utf-8")))
    written = skipped = 0
    failures = []
    for rel in sorted(paths):
        full = os.path.join(WORKSPACE, rel)
        if os.path.isfile(full):
            skipped += 1
            continue
        stage = os.path.join(INCOMING, rel.replace("/", "__"))
        if not os.path.isfile(stage):
            continue
        content = open(stage, encoding="utf-8").read()
        if not content.strip():
            failures.append({"path": rel, "error": "empty content"})
            continue
        r = subprocess.run(
            [sys.executable, WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode:
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
        else:
            written += 1
            print(r.stdout.strip())
    still = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]
    print(json.dumps({
        "written": written,
        "skipped": skipped,
        "failed": len(failures),
        "failures": failures,
        "still_missing_count": len(still),
        "still_missing": still,
    }))


if __name__ == "__main__":
    main()
