#!/usr/bin/env python3
"""Apply all files from fetch_batch40 dir to workspace via mcp_immediate_write."""
import json
import os
import subprocess
import sys
from pathlib import Path

WORKSPACE = Path("/workspace")
FETCH = Path("/workspace/.export-tmp/fetch_batch40")
STAGING = Path("/workspace/.export-tmp/staging_batch40")
WRITE = "/workspace/tools/mcp_immediate_write.py"
BATCH = Path("/workspace/.export-tmp/batch_40_80.json")


def enc(p: str) -> str:
    return p.replace("/", "__")


def apply_one(rel: str, content: str) -> str:
    stage = STAGING / enc(rel)
    stage.parent.mkdir(parents=True, exist_ok=True)
    stage.write_text(content, encoding="utf-8")
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout or "write failed").strip())
    return r.stdout.strip()


def main():
    paths = json.load(open(BATCH, encoding="utf-8"))
    missing = [p for p in paths if not (WORKSPACE / p).is_file()]
    written = []
    failures = []
    for rel in missing:
        src = FETCH / enc(rel)
        if not src.is_file():
            failures.append({"path": rel, "error": "no fetch content"})
            continue
        try:
            content = src.read_text(encoding="utf-8")
            msg = apply_one(rel, content)
            written.append(rel)
            print(msg)
        except Exception as e:
            failures.append({"path": rel, "error": str(e)})
    still = [p for p in paths if not (WORKSPACE / p).is_file()]
    print(json.dumps({"written": written, "written_count": len(written), "failures": failures, "still_missing": still}, indent=2))


if __name__ == "__main__":
    main()
