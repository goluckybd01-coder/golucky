#!/usr/bin/env python3
"""Bulk write files from export_stage using mcp_immediate_write.py."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
STAGE = "/workspace/.export-tmp/export_stage"
WRITE = "/workspace/tools/mcp_immediate_write.py"
MANIFEST = "/workspace/.export-tmp/export_manifest.json"


def enc(p: str) -> str:
    return p.replace("/", "__")


def write_one(rel: str, content: str) -> tuple[bool, str]:
    proc = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if proc.returncode:
        return False, (proc.stderr or proc.stdout).strip()
    return True, proc.stdout.strip()


def main():
    if not os.path.isfile(MANIFEST):
        print(json.dumps({"error": "no manifest", "written": 0, "failed": 0}))
        return

    manifest = json.load(open(MANIFEST, encoding="utf-8"))
    paths = manifest.get("paths", [])
    written, failures, skipped = 0, [], 0

    for rel in paths:
        dest = os.path.join(WORKSPACE, rel)
        if os.path.isfile(dest) and os.path.getsize(dest) > 100:
            skipped += 1
            continue
        stage_file = os.path.join(STAGE, enc(rel))
        if not os.path.isfile(stage_file):
            failures.append({"path": rel, "error": "no staged content"})
            continue
        with open(stage_file, encoding="utf-8") as f:
            content = f.read()
        ok, msg = write_one(rel, content)
        if ok:
            written += 1
            print(msg)
        else:
            failures.append({"path": rel, "error": msg})

    print(json.dumps({"written": written, "skipped": skipped, "failed": len(failures), "failures": failures}))


if __name__ == "__main__":
    main()
