#!/usr/bin/env python3
"""Flush staged Lovable reads to workspace via mcp_immediate_write.py."""
import json
import subprocess
import sys
from pathlib import Path

STAGING = Path("/workspace/.export-tmp/batch_missing_staging")
MANIFEST = Path("/workspace/.export-tmp/batch_missing_paths.json")
WRITE = Path("/workspace/tools/mcp_immediate_write.py")
WORKSPACE = Path("/workspace")


def stage_name(rel: str) -> str:
    return rel.replace("/", "__")


def main() -> int:
    written = failed = 0
    failures = []
    paths = json.loads(MANIFEST.read_text(encoding="utf-8"))
    for rel in paths:
        dest = WORKSPACE / rel
        stage = STAGING / stage_name(rel)
        if dest.is_file() and dest.stat().st_size > 0:
            print(f"SKIP existing {rel}")
            written += 1
            continue
        if not stage.is_file():
            failures.append({"path": rel, "error": "not staged"})
            failed += 1
            continue
        content = stage.read_text(encoding="utf-8")
        if not content.strip() or content.startswith("Lovable API error"):
            failures.append({"path": rel, "error": "empty or error content"})
            failed += 1
            continue
        r = subprocess.run(
            [sys.executable, str(WRITE), rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode != 0:
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
            failed += 1
            continue
        written += 1
        print((r.stdout or "").strip())
    print(json.dumps({"written": written, "failed": failed, "failures": failures}, indent=2))
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
