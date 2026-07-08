#!/usr/bin/env python3
"""Flush staging dirs to workspace via mcp_immediate_write.py (always overwrite)."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
WRITE = os.path.join(WORKSPACE, "tools", "mcp_immediate_write.py")

STAGING_DIRS = [
    os.path.join(WORKSPACE, ".export-tmp/fetched"),
    os.path.join(WORKSPACE, ".export-tmp/mcp_incoming"),
    os.path.join(WORKSPACE, ".export-tmp/staging_batch40"),
]


def stage_to_rel(stage_name: str) -> str:
    if stage_name.startswith("src__"):
        return stage_name.replace("__", "/")
    return stage_name


def write_one(rel: str, content: str):
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    return r.returncode == 0, (r.stderr or r.stdout).strip()


def main():
    written = failed = 0
    failures = []
    seen = set()
    for d in STAGING_DIRS:
        if not os.path.isdir(d):
            continue
        for name in sorted(os.listdir(d)):
            rel = stage_to_rel(name)
            if rel in seen:
                continue
            seen.add(rel)
            path = os.path.join(d, name)
            if not os.path.isfile(path):
                continue
            with open(path, encoding="utf-8") as f:
                content = f.read()
            if not content.strip():
                failed += 1
                failures.append({"path": rel, "error": "empty"})
                continue
            ok, msg = write_one(rel, content)
            if ok:
                written += 1
                print(msg)
            else:
                failed += 1
                failures.append({"path": rel, "error": msg})
    print(json.dumps({"written": written, "failed": failed, "failures": failures}, indent=2))


if __name__ == "__main__":
    main()
