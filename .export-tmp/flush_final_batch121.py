#!/usr/bin/env python3
"""Flush remaining batch121 files from staging manifest TSV: rel_path<TAB>staging_file"""
import json
import subprocess
import sys

WRITE = "/workspace/tools/mcp_immediate_write.py"

MANIFEST = [
    ("src/pages/games/__tests__/VideoWinGo.placeBet.test.tsx", "vwg_placebet.tsx"),
    ("src/pages/settings/__tests__/BadgeSettings.test.tsx", "badge_settings.test.tsx"),
    ("src/test/agent-apply-payload.test.ts", "agent_apply.test.ts"),
    ("src/stories/AviatorServerSeedField.mdx", "aviator.mdx"),
    ("src/pages/admin/__tests__/DualWalletOverview.sorting.test.tsx", "dual_wallet.test.tsx"),
    ("src/pages/admin/__tests__/GameLaunchNotifications.test.tsx", "game_launch.test.tsx"),
    ("src/services/sportsApi.ts", "sportsApi.ts"),
    ("src/test/deposit-centre-flag.test.tsx", "deposit_flag.test.tsx"),
    ("src/test/api-game-controls-commission-audit-actor.test.ts", "commission_actor.test.ts"),
    ("src/test/api-game-controls-commission-audit.test.ts", "commission_audit.test.ts"),
    ("src/test/api-game-controls-commission-override.test.ts", "commission_override.test.ts"),
    ("src/test/api-game-controls-enable-disable.test.ts", "enable_disable.test.ts"),
    ("src/test/wallet-centre-2026-lock-checklist.test.ts", "wallet_lock.test.ts"),
    ("src/test/wallet-centre-no-demo-data.test.ts", "wallet_nodemo.test.ts"),
]

STAGING = "/workspace/.export-tmp/staging"

def main():
    written = failed = 0
    failures = []
    for rel, fname in MANIFEST:
        staging = f"{STAGING}/{fname}"
        try:
            content = open(staging, encoding="utf-8").read()
        except FileNotFoundError:
            failures.append({"path": rel, "error": f"staging missing: {fname}"})
            failed += 1
            continue
        r = subprocess.run(
            ["python3", WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode == 0:
            written += 1
            print(r.stdout.strip())
        else:
            failed += 1
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
    print(json.dumps({"written": written, "failed": failed, "failures": failures}))

if __name__ == "__main__":
    main()
