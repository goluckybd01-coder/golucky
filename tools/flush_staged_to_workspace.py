#!/usr/bin/env python3
"""Flush staged files: JSON map {rel_path: abs_stage_path} or dir of path__files."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
WRITE = "/workspace/tools/mcp_immediate_write.py"


def write_one(rel: str, content: str):
    proc = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    return proc.returncode == 0, (proc.stderr or proc.stdout).strip()


def main():
    if len(sys.argv) < 2:
        print("Usage: flush_staged_to_workspace.py <mapping.json>")
        sys.exit(1)
    mapping = json.load(open(sys.argv[1], encoding="utf-8"))
    written, failures = 0, []
    for rel, stage_path in mapping.items():
        if not os.path.isfile(stage_path):
            failures.append({"path": rel, "error": f"missing stage: {stage_path}"})
            continue
        with open(stage_path, encoding="utf-8") as f:
            content = f.read()
        ok, msg = write_one(rel, content)
        if ok:
            written += 1
            print(msg)
        else:
            failures.append({"path": rel, "error": msg})
    print(json.dumps({"written": written, "failed": len(failures), "failures": failures}))


if __name__ == "__main__":
    main()
