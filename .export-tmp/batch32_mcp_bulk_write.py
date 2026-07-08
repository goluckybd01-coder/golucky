#!/usr/bin/env python3
"""Write batch32 files from .export-tmp/batch32_mcp_chunks/*.json via mcp_immediate_write."""
import json
import os
import subprocess
import sys
import glob

WORKSPACE = "/workspace"
CHUNKS = os.path.join(WORKSPACE, ".export-tmp/batch32_mcp_chunks")
PIPE = os.path.join(WORKSPACE, "tools/batch32_pipe_write.py")


def write_one(rel: str, content: str) -> bool:
    if not content or not str(content).strip():
        print(f"SKIP empty: {rel}", file=sys.stderr)
        return False
    r = subprocess.run(
        [sys.executable, PIPE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        print(f"FAIL {rel}: {r.stderr or r.stdout}", file=sys.stderr)
        return False
    print(r.stdout.strip())
    return True


def main():
    os.makedirs(CHUNKS, exist_ok=True)
    written = failed = 0
    for chunk in sorted(glob.glob(os.path.join(CHUNKS, "*.json"))):
        data = json.load(open(chunk, encoding="utf-8"))
        items = data if isinstance(data, list) else [data]
        for item in items:
            rel = item["path"]
            content = item.get("content", "")
            if write_one(rel, content):
                written += 1
            else:
                failed += 1
    print(json.dumps({"written": written, "failed": failed}))


if __name__ == "__main__":
    main()
