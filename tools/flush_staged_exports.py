#!/usr/bin/env python3
"""Write staged export files via mcp_immediate_write.py.

Stage files under .export-tmp/export_stage/ as <path-with-__slashes>.
Usage: flush_staged_exports.py [path1 path2 ...]
"""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
STAGE = "/workspace/.export-tmp/export_stage"
WRITE = "/workspace/tools/mcp_immediate_write.py"


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
    paths = sys.argv[1:] if len(sys.argv) > 1 else None
    if paths is None:
        paths = []
        if os.path.isdir(STAGE):
            for name in sorted(os.listdir(STAGE)):
                paths.append(name.replace("__", "/"))

    written, failures = 0, []
    for rel in paths:
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
            os.remove(stage_file)
        else:
            failures.append({"path": rel, "error": msg})

    print(json.dumps({"written": written, "failed": len(failures), "failures": failures}))


if __name__ == "__main__":
    main()
