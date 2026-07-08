#!/usr/bin/env python3
"""Apply staged Lovable fetches via mcp_immediate_write.py."""
import subprocess
import sys
from pathlib import Path

STAGING = Path("/workspace/.export-tmp/lovable_fetched")
WRITE = "/workspace/tools/mcp_immediate_write.py"
CORRUPTED = 'import PageScaffold from "@/components/templates/PageScaffold"'

FILES = [
    "src/components/game/AIPredictionHistory.tsx",
    "src/components/game/CrashAutoBet.tsx",
    "src/components/game/ResultModal.tsx",
    "src/components/game/BetHistoryChart.tsx",
]


def main():
    fixed = 0
    for rel in FILES:
        stage = STAGING / rel.replace("/", "__")
        if not stage.is_file():
            print(f"MISSING {rel}")
            continue
        content = stage.read_text(encoding="utf-8")
        r = subprocess.run(
            [sys.executable, WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode:
            print(f"FAIL {rel}: {r.stderr or r.stdout}")
            continue
        head = Path(f"/workspace/{rel}").read_text(encoding="utf-8")[:500]
        if CORRUPTED in head:
            print(f"STILL_CORRUPT {rel}")
            continue
        print(f"OK {rel}")
        fixed += 1
    print(f"FIXED={fixed}/{len(FILES)}")
    return 0 if fixed == len(FILES) else 1


if __name__ == "__main__":
    raise SystemExit(main())
