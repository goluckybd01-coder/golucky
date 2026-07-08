#!/usr/bin/env python3
"""Write 8 missing files from mcp_raw staging via mcp_immediate_write."""
import subprocess
import sys
from pathlib import Path

WRITE = "/workspace/tools/mcp_immediate_write.py"
STAGING = Path("/workspace/.export-tmp/mcp_raw")

FILES = [
    "src/components/game/GlobalResultModal.tsx",
    "src/components/deposit/USDTDepositFlow.tsx",
    "src/components/aviator/AviatorLiveBets.tsx",
    "src/components/game/CrashSessionTracker.tsx",
    "src/components/game/K3DiceBoard.tsx",
    "src/components/game/LiveBetsFeed.tsx",
    "src/components/game/LivePlayersList.tsx",
    "src/components/admin/unified/UsersModule.tsx",
]


def main() -> int:
    written = failed = 0
    for rel in FILES:
        stage = STAGING / Path(rel).name
        if not stage.is_file():
            print(f"MISSING staging: {stage}", file=sys.stderr)
            failed += 1
            continue
        content = stage.read_text(encoding="utf-8")
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
    print(f"written={written} failed={failed}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
