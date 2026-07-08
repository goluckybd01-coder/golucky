#!/usr/bin/env python3
"""Write first-40 missing files from mcp_incoming via mcp_immediate_write."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
INCOMING = "/workspace/.export-tmp/mcp_incoming"
WRITE = "/workspace/tools/mcp_immediate_write.py"
PATHS_FILE = "/workspace/.export-tmp/first40_missing.json"


def main():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    written = skipped = failed = 0
    failures = []
    for rel in paths:
        full = os.path.join(WORKSPACE, rel)
        if os.path.isfile(full):
            skipped += 1
            continue
        stage = os.path.join(INCOMING, rel.replace("/", "__"))
        if not os.path.isfile(stage):
            continue
        content = open(stage, encoding="utf-8").read()
        if not content.strip() or content.startswith("Lovable API error"):
            failures.append({"path": rel, "error": "empty or API error"})
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
    still = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]
    print(json.dumps({
        "written": written,
        "skipped": skipped,
        "failed": failed,
        "failures": failures,
        "still_missing": len(still),
        "still_missing_paths": still,
    }, indent=2))


if __name__ == "__main__":
    main()
