#!/usr/bin/env python3
"""Flush staged Lovable fetches via mcp_immediate_write.py."""
import json
import subprocess
import sys
from pathlib import Path

STAGING = Path("/workspace/.export-tmp/lovable_fetched")
WRITE = "/workspace/tools/mcp_immediate_write.py"
MANIFEST = Path("/workspace/.export-tmp/batch_missing_paths.json")


def main():
    paths = json.loads(MANIFEST.read_text(encoding="utf-8"))
    written = 0
    failures = []
    for rel in paths:
        stage = STAGING / rel.replace("/", "__")
        if not stage.is_file():
            failures.append({"path": rel, "error": "staging file missing"})
            continue
        content = stage.read_text(encoding="utf-8")
        if not content.strip():
            failures.append({"path": rel, "error": "empty staging content"})
            continue
        r = subprocess.run(
            [sys.executable, WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode != 0:
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
            continue
        written += 1
        print((r.stdout or "").strip())
    print(json.dumps({"written": written, "failed": len(failures), "failures": failures}, indent=2))
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
