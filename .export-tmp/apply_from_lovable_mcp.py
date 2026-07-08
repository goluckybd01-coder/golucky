#!/usr/bin/env python3
"""Fetch files from Lovable via MCP subprocess and write via mcp_immediate_write."""
import json
import os
import subprocess
import sys

PROJECT_ID = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
WRITE = "/workspace/tools/mcp_immediate_write.py"
SKIP = {"src/hooks/useAuth.ts"}

PATHS = [
    "src/components/game/GlobalResultModal.tsx",
    "src/components/game/SuspenseReveal.tsx",
    "src/components/deposit/USDTDepositFlow.tsx",
    "src/components/aviator/AviatorLiveBets.tsx",
    "src/components/aviator/AviatorStreakBonus.tsx",
    "src/components/game/CrashSessionTracker.tsx",
    "src/components/game/CrashSoundSettings.tsx",
    "src/components/game/K3DiceBoard.tsx",
    "src/components/game/LiveBetsFeed.tsx",
    "src/components/game/LivePlayersList.tsx",
    "src/components/game/ProvablyFairDisplay.tsx",
    "src/components/admin/unified/StaffManagement.tsx",
    "src/components/admin/unified/UsersModule.tsx",
    "src/components/admin/unified/WithdrawRequestsModule.tsx",
    "src/hooks/useAuth.ts",
    "src/hooks/useAudioManager.ts",
]

STAGING = "/workspace/.export-tmp/batch_missing_staging"


def enc(rel: str) -> str:
    return rel.replace("/", "__")


def write_file(rel: str, content: str) -> bool:
    if not content or not content.strip():
        print(f"SKIP empty: {rel}")
        return False
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        print(f"FAIL {rel}: {r.stderr or r.stdout}", file=sys.stderr)
        return False
    print(r.stdout.strip())
    return True


def main():
    written = 0
    skipped = 0
    for rel in PATHS:
        if rel in SKIP:
            print(f"SKIP not in Lovable: {rel}")
            skipped += 1
            continue
        dest = os.path.join("/workspace", rel)
        if os.path.isfile(dest) and os.path.getsize(dest) > 0:
            print(f"SKIP existing: {rel}")
            skipped += 1
            continue
        stage = os.path.join(STAGING, enc(rel))
        if not os.path.isfile(stage):
            print(f"MISSING staged: {rel}")
            continue
        with open(stage, encoding="utf-8") as f:
            content = f.read()
        if write_file(rel, content):
            written += 1
    print(json.dumps({"written": written, "skipped": skipped}))


if __name__ == "__main__":
    main()
