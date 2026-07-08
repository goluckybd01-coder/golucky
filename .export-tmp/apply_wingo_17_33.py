#!/usr/bin/env python3
"""Apply wingo indices 17-33 from fetch_batch40 via mcp_immediate_write."""
import json
import subprocess
import sys
from pathlib import Path

WORKSPACE = Path("/workspace")
FETCH = Path("/workspace/.export-tmp/fetch_batch40")
PATHS_FILE = Path("/workspace/.export-tmp/wingo_paths_17_33.json")
WRITE = "/workspace/tools/mcp_immediate_write.py"


def enc(p: str) -> str:
    return p.replace("/", "__")


def main():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    written = []
    failed = []
    for rel in paths:
        src = FETCH / enc(rel)
        if not src.is_file():
            failed.append({"path": rel, "error": "missing staging file"})
            continue
        content = src.read_text(encoding="utf-8")
        if not content.strip():
            failed.append({"path": rel, "error": "empty content"})
            continue
        r = subprocess.run(
            [sys.executable, WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode:
            failed.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
        else:
            written.append(rel)
            print(r.stdout.strip())
    print(json.dumps({"fixed_count": len(written), "written": written, "failed": failed}, indent=2))


if __name__ == "__main__":
    main()
