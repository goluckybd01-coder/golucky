#!/usr/bin/env python3
"""Apply all staged mcp_raw files that map to missing batch paths."""
import subprocess
import sys
from pathlib import Path

WRITE = "/workspace/tools/mcp_immediate_write.py"
STAGING = Path("/workspace/.export-tmp/mcp_raw")

MAPPING = {
    "GlobalResultModal.tsx": "src/components/game/GlobalResultModal.tsx",
    "USDTDepositFlow.tsx": "src/components/deposit/USDTDepositFlow.tsx",
    "AviatorLiveBets.tsx": "src/components/aviator/AviatorLiveBets.tsx",
    "CrashSessionTracker.tsx": "src/components/game/CrashSessionTracker.tsx",
    "K3DiceBoard.tsx": "src/components/game/K3DiceBoard.tsx",
    "LiveBetsFeed.tsx": "src/components/game/LiveBetsFeed.tsx",
    "LivePlayersList.tsx": "src/components/game/LivePlayersList.tsx",
    "UsersModule.tsx": "src/components/admin/unified/UsersModule.tsx",
}

def main():
    written = skipped = failed = 0
    for name, rel in MAPPING.items():
        dest = Path("/workspace") / rel
        if dest.is_file() and dest.stat().st_size > 0:
            skipped += 1
            continue
        stage = STAGING / name
        if not stage.is_file():
            print(f"MISSING {name}", file=sys.stderr)
            failed += 1
            continue
        content = stage.read_text(encoding="utf-8")
        r = subprocess.run([sys.executable, WRITE, rel], input=content, text=True, capture_output=True)
        if r.returncode != 0:
            print(f"FAIL {rel}: {r.stderr or r.stdout}", file=sys.stderr)
            failed += 1
        else:
            written += 1
            print((r.stdout or "").strip())
    print(f"written={written} skipped={skipped} failed={failed}")
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    raise SystemExit(main())
