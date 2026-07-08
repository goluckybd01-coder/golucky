#!/usr/bin/env python3
"""Write last 2 corrupted files via mcp_immediate_write from staged full content."""
import subprocess
import sys
from pathlib import Path

WRITE = "/workspace/tools/mcp_immediate_write.py"
STAGING = Path("/workspace/.export-tmp/staging_last_two")

FILES = [
    ("src/pages/Leaderboard.tsx", "Leaderboard.tsx"),
    ("src/components/game/BetHistoryFilters.tsx", "BetHistoryFilters.tsx"),
]


def main():
    for rel, name in FILES:
        src = STAGING / name
        if not src.exists():
            print(f"MISSING {src}", file=sys.stderr)
            sys.exit(1)
        content = src.read_text(encoding="utf-8")
        if not content.strip():
            print(f"EMPTY {rel}", file=sys.stderr)
            sys.exit(1)
        r = subprocess.run(
            [sys.executable, WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode:
            print(r.stderr or r.stdout, file=sys.stderr)
            sys.exit(1)
        print(r.stdout.strip())
        if name == "Leaderboard.tsx" and "export default Leaderboard" not in content:
            print("BAD Leaderboard marker", file=sys.stderr)
            sys.exit(1)
        if name == "BetHistoryFilters.tsx" and "export default BetHistoryFilters" not in content:
            print("BAD BetHistoryFilters marker", file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    main()
