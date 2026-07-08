#!/usr/bin/env python3
"""Apply remaining batch34 files from pre-staged .export-tmp/wingo_restore_34 via mcp_immediate_write."""
import os
import subprocess
import sys

WORKSPACE = "/workspace"
STAGING = os.path.join(WORKSPACE, ".export-tmp/wingo_restore_34")
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")

PATHS = [
    "src/components/game/BetSummaryModal.tsx",
    "src/components/game/CashoutConfetti.tsx",
    "src/components/game/BetPanelContent.tsx",
    "src/components/game/AIPredictionHistory.tsx",
    "src/components/game/BetSheet.tsx",
    "src/components/game/CrashAutoBet.tsx",
    "src/components/game/ResultModal.tsx",
    "src/components/game/BetHistoryChart.tsx",
    "src/components/templates/ExamplePage.tsx",
    "src/pages/games/VideoWinGo.tsx",
    "src/pages/games/MotoRace.tsx",
    "src/pages/games/MinesGame.tsx",
    "src/pages/games/useWingoResultBanner.test.tsx",
]

CORRUPTED = 'import PageScaffold from "@/components/templates/PageScaffold"'
LEGIT = {
    "src/components/templates/ExamplePage.tsx",
    "src/pages/games/VideoWinGo.tsx",
    "src/pages/games/MotoRace.tsx",
    "src/pages/games/MinesGame.tsx",
}


def enc(p: str) -> str:
    return p.replace("/", "__")


def main():
    fixed = 0
    for rel in PATHS:
        stage = os.path.join(STAGING, enc(rel))
        if not os.path.isfile(stage):
            print(f"MISSING {stage}", file=sys.stderr)
            continue
        content = open(stage, encoding="utf-8").read()
        r = subprocess.run([sys.executable, WRITE, rel], input=content, text=True, capture_output=True)
        if r.returncode:
            print(f"FAIL {rel}: {r.stderr}", file=sys.stderr)
            continue
        with open(os.path.join(WORKSPACE, rel), encoding="utf-8") as f:
            head = f.read(500)
        ok = "PageScaffold" in head if rel in LEGIT else CORRUPTED not in head
        if ok:
            fixed += 1
            print(f"OK {rel}")
        else:
            print(f"VERIFY_FAIL {rel}", file=sys.stderr)
    print(f"FIXED={fixed}/{len(PATHS)}")
    return 0 if fixed == len(PATHS) else 1


if __name__ == "__main__":
    sys.exit(main())
