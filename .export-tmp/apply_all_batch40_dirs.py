#!/usr/bin/env python3
"""Apply all files from fetch_batch40 + staging_batch40 to workspace."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
WRITE = "/workspace/tools/mcp_immediate_write.py"
DIRS = [
    "/workspace/.export-tmp/fetch_batch40",
    "/workspace/.export-tmp/staging_batch40",
]
BATCH = "/workspace/.export-tmp/batch_40_80.json"


def stage_name_to_rel(name: str) -> str:
    return name.replace("__", "/")


def write_one(rel: str, content: str) -> tuple[bool, str]:
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode:
        return False, (r.stderr or r.stdout).strip()
    return True, r.stdout.strip()


def main():
    targets = set(json.load(open(BATCH, encoding="utf-8")))
    written = []
    failed = []
    seen = set()

    for d in DIRS:
        if not os.path.isdir(d):
            continue
        for name in sorted(os.listdir(d)):
            path = os.path.join(d, name)
            if not os.path.isfile(path):
                continue
            rel = stage_name_to_rel(name)
            if rel in seen:
                continue
            seen.add(rel)
            content = open(path, encoding="utf-8").read()
            if not content.strip():
                failed.append({"path": rel, "error": "empty"})
                continue
            ok, msg = write_one(rel, content)
            if ok:
                written.append(rel)
                print(msg)
            else:
                failed.append({"path": rel, "error": msg})

    still = [p for p in targets if not os.path.isfile(os.path.join(WORKSPACE, p))]
    print(json.dumps({"written": written, "failed": failed, "still_missing": still}, indent=2))


if __name__ == "__main__":
    main()
