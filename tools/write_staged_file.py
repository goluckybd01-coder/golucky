#!/usr/bin/env python3
"""Write one staged export file and apply via mcp_immediate_write.py."""
import subprocess
import sys
from pathlib import Path

WRITE = Path("/workspace/tools/mcp_immediate_write.py")
STAGING = Path("/workspace/.export-tmp/batch_missing_staging")


def enc(rel: str) -> str:
    return rel.replace("/", "__")


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: write_staged_file.py <rel-path>", file=sys.stderr)
        return 1
    rel = sys.argv[1]
    stage = STAGING / enc(rel)
    if not stage.is_file():
        print(f"ERROR missing stage: {stage}", file=sys.stderr)
        return 1
    content = stage.read_text(encoding="utf-8")
    if not content.strip():
        print(f"ERROR empty: {rel}", file=sys.stderr)
        return 1
    r = subprocess.run(
        [sys.executable, str(WRITE), rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        print(r.stderr or r.stdout, file=sys.stderr)
        return 1
    print(r.stdout.strip())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
