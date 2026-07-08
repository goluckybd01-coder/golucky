#!/usr/bin/env python3
"""Batch export missing Lovable files: read path+content JSONL, write via mcp_immediate_write."""
import json
import subprocess
import sys
from pathlib import Path

WRITE = "/workspace/tools/mcp_immediate_write.py"
JSONL = Path("/workspace/.export-tmp/missing_mcp_content.jsonl")


def main() -> int:
    if not JSONL.is_file():
        print(f"missing {JSONL}", file=sys.stderr)
        return 1
    written = failed = 0
    for line in JSONL.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        obj = json.loads(line)
        rel, content = obj["path"], obj["content"]
        dest = Path("/workspace") / rel
        if dest.is_file() and dest.stat().st_size > 0:
            print(f"SKIP existing {rel}")
            continue
        r = subprocess.run(
            [sys.executable, WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode != 0:
            print(f"FAIL {rel}: {r.stderr or r.stdout}", file=sys.stderr)
            failed += 1
        else:
            written += 1
            print((r.stdout or "").strip())
    print(json.dumps({"written": written, "failed": failed}))
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
