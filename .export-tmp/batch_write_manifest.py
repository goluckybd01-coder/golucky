#!/usr/bin/env python3
"""Batch write from manifest JSON {rel_path: content_file_path} via mcp_immediate_write."""
import json
import os
import subprocess
import sys

WRITE_SCRIPT = "/workspace/.export-tmp/write_content_file.py"
WORKSPACE = "/workspace"


def main():
    manifest_path = sys.argv[1]
    manifest = json.load(open(manifest_path, encoding="utf-8"))
    written = 0
    skipped = 0
    failures = []
    for rel, content_file in manifest.items():
        if os.path.isfile(os.path.join(WORKSPACE, rel)):
            skipped += 1
            continue
        if not os.path.isfile(content_file):
            failures.append({"path": rel, "error": f"missing content file {content_file}"})
            continue
        r = subprocess.run(
            ["python3", WRITE_SCRIPT, rel, content_file],
            capture_output=True,
            text=True,
        )
        if r.returncode == 0:
            written += 1
            print(r.stdout.strip())
        else:
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
    print(json.dumps({"written": written, "skipped": skipped, "failed": len(failures), "failures": failures}))


if __name__ == "__main__":
    main()
