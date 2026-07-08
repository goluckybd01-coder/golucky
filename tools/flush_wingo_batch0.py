#!/usr/bin/env python3
"""Flush corrupted_restore_batch0 staging via mcp_immediate_write.py."""
import os
import subprocess
import sys

STAGING = "/workspace/.export-tmp/corrupted_restore_batch0"
WRITE = "/workspace/tools/mcp_immediate_write.py"
CORRUPTED_MARKER = 'import PageScaffold from "@/components/templates/PageScaffold"'
WINGO_PATH = "src/pages/games/WinGo.tsx"

PATHS = [
    "src/hooks/useAIPrediction.ts",
    "src/hooks/useGameBets.ts",
    "src/components/WinAmountDisplay.tsx",
    "src/components/BetPlacedAnimation.tsx",
    "src/components/MainLayout.tsx",
    "src/content/fiveDHowToPlay.ts",
    "src/content/k3HowToPlay.ts",
    "src/content/wingoHowToPlay.ts",
    "src/content/trxWinHowToPlay.ts",
    "src/lib/gameEngineBase.ts",
    "src/lib/autoVerifyPredictions.ts",
    "src/lib/gameStorage.ts",
    "src/lib/gameHistoryService.ts",
    "src/lib/winGoRoundEngine.ts",
    "src/lib/houseEdgeResult.ts",
    "src/lib/fiveDChartStats.ts",
    "src/lib/k3RoundKey.ts",
]


def enc(path: str) -> str:
    return path.replace("/", "__")


def verify(rel: str) -> bool:
    full = os.path.join("/workspace", rel)
    with open(full, encoding="utf-8") as f:
        content = f.read()
    if CORRUPTED_MARKER not in content:
        return True
    return rel == WINGO_PATH


def main():
    fixed = 0
    failures = []
    for rel in PATHS:
        stage = os.path.join(STAGING, enc(rel))
        if not os.path.isfile(stage):
            failures.append({"path": rel, "error": "missing staging file"})
            continue
        content = open(stage, encoding="utf-8").read()
        if not content.strip():
            failures.append({"path": rel, "error": "empty staging file"})
            continue
        r = subprocess.run(
            [sys.executable, WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode:
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
            continue
        if verify(rel):
            fixed += 1
            print(f"OK {rel}")
        else:
            failures.append({"path": rel, "error": "still contains PageScaffold import"})
    import json
    print(json.dumps({"fixed": fixed, "total": len(PATHS), "failures": failures}, indent=2))
    return 0 if fixed == len(PATHS) else 1


if __name__ == "__main__":
    sys.exit(main())
