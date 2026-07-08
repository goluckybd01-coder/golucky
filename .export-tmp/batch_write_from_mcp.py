#!/usr/bin/env python3
"""Write files from mcp_incoming staging via mcp_immediate_write.py."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
INCOMING = "/workspace/.export-tmp/mcp_incoming"
WRITE = "/workspace/tools/mcp_immediate_write.py"
PATHS_FILE = "/workspace/.export-tmp/slice_81_120_paths.json"


def main():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    missing = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]
    written, failures = 0, []
    for rel in missing:
        stage = os.path.join(INCOMING, rel.replace("/", "__"))
        if not os.path.isfile(stage):
            failures.append({"path": rel, "error": "no incoming content"})
            continue
        with open(stage, encoding="utf-8") as f:
            content = f.read()
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
    print(json.dumps({"written": written, "failed": len(failures), "failures": failures, "still_missing": still}))


if __name__ == "__main__":
    main()
