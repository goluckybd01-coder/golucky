#!/usr/bin/env python3
"""Flush staged files via mcp_immediate_write.py from a manifest [{path, stage}]."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
STAGE = "/workspace/.export-tmp/stage"
WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    manifest_path = sys.argv[1] if len(sys.argv) > 1 else "/workspace/.export-tmp/stage_manifest.json"
    items = json.load(open(manifest_path, encoding="utf-8"))
    written = skipped = failed = 0
    failures = []
    for item in items:
        rel = item["path"]
        if os.path.isfile(os.path.join(WORKSPACE, rel)):
            skipped += 1
            continue
        stage_name = item.get("stage") or rel.replace("/", "__")
        stage_path = os.path.join(STAGE, stage_name)
        if not os.path.isfile(stage_path):
            failed += 1
            failures.append({"path": rel, "error": f"missing stage {stage_path}"})
            continue
        content = open(stage_path, encoding="utf-8").read()
        r = subprocess.run(
            ["python3", WRITE, rel],
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
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures}))


if __name__ == "__main__":
    main()
