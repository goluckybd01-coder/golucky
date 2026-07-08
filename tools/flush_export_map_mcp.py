#!/usr/bin/env python3
"""Flush current_export_map.json via mcp_immediate_write.py"""
import json
import subprocess
import sys
from pathlib import Path

MAP = Path("/workspace/.export-tmp/current_export_map.json")
WRITE = "/workspace/tools/mcp_immediate_write.py"


def main() -> int:
    if not MAP.is_file():
        print("no map", file=sys.stderr)
        return 1
    data = json.loads(MAP.read_text(encoding="utf-8"))
    written = failed = 0
    for rel, content in data.items():
        if not content or not str(content).strip():
            failed += 1
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
    MAP.write_text("{}", encoding="utf-8")
    print(json.dumps({"written": written, "failed": failed}))
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
