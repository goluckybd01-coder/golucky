#!/usr/bin/env python3
"""Recover batch 3 page files from agent-tools MCP outputs by signature matching."""
import glob
import json
import os
import re

WORKSPACE = "/workspace"
TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"

PATHS = [
    "src/pages/admin/LuckyHubCentral.tsx",
    "src/pages/admin/PaymentManagement.tsx",
    "src/pages/admin/SystemLogs.tsx",
    "src/pages/admin/ReportsAnalytics.tsx",
    "src/pages/admin/LuckyHubAdmin.tsx",
    "src/pages/games/MotoRace.tsx",
    "src/pages/games/VideoWinGo.tsx",
    "src/pages/games/CrashGame.tsx",
    "src/pages/settings/BadgeSettings.tsx",
    "src/pages/admin/CrashGameAdmin.tsx",
    "src/pages/admin/GameLaunchNotifications.tsx",
    "src/pages/games/MinesGame.tsx",
    "src/pages/admin/MinesGameAdmin.tsx",
    "src/pages/admin/PayoutAuditLogs.tsx",
    "src/pages/admin/UserHistory.tsx",
    "src/pages/admin/WinGoGameAdmin.tsx",
    "src/pages/admin/K3GameAdmin.tsx",
    "src/pages/admin/FiveDGameAdmin.tsx",
]

SIGNATURES = {
    "src/pages/admin/LuckyHubCentral.tsx": "Lucky Hub – Central fintech-style admin dashboard",
    "src/pages/admin/PaymentManagement.tsx": "export default function PaymentManagement",
    "src/pages/admin/SystemLogs.tsx": "export default function SystemLogs",
    "src/pages/admin/ReportsAnalytics.tsx": "export default function ReportsAnalytics",
    "src/pages/admin/LuckyHubAdmin.tsx": "export default function LuckyHubAdmin",
    "src/pages/games/MotoRace.tsx": 'const GAME_KEY = "motorace"',
    "src/pages/games/VideoWinGo.tsx": 'const GAME_KEY = "videoWingo"',
    "src/pages/games/CrashGame.tsx": "PageScaffold",
    "src/pages/settings/BadgeSettings.tsx": "export default function BadgeSettings",
    "src/pages/admin/CrashGameAdmin.tsx": "const CrashGameAdmin = ()",
    "src/pages/admin/GameLaunchNotifications.tsx": "mapSignupsWithProfiles",
    "src/pages/games/MinesGame.tsx": "const MinesGame = ()",
    "src/pages/admin/MinesGameAdmin.tsx": "const MinesGameAdmin = ()",
    "src/pages/admin/PayoutAuditLogs.tsx": "Large Payout Audit Logs",
    "src/pages/admin/UserHistory.tsx": "exportUserTransactions",
    "src/pages/admin/WinGoGameAdmin.tsx": "const WinGoGameAdmin = ()",
    "src/pages/admin/K3GameAdmin.tsx": "const K3GameAdmin = ()",
    "src/pages/admin/FiveDGameAdmin.tsx": "const FiveDGameAdmin = ()",
}


def write_file(rel, content):
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")


def main():
    pending = {p: SIGNATURES[p] for p in PATHS}
    written = []
    seen_content = set()

    for tf in sorted(glob.glob(os.path.join(TOOLS, "*.txt")), key=os.path.getmtime, reverse=True):
        with open(tf, encoding="utf-8", errors="replace") as f:
            content = f.read().strip()
        if not content or len(content) < 100:
            continue
        if content.startswith("{") and '"pagination"' in content[:500]:
            continue
        if content.startswith("Lovable API error"):
            continue
        # CrashGame is huge; use size heuristic too
        content_key = content[:200] + str(len(content))
        if content_key in seen_content:
            continue

        matched = []
        for path, sig in list(pending.items()):
            if sig in content:
                # CrashGame: require large file
                if path == "src/pages/games/CrashGame.tsx" and len(content) < 50000:
                    continue
                matched.append(path)

        if len(matched) == 1:
            path = matched[0]
            write_file(path, content)
            written.append(path)
            del pending[path]
            seen_content.add(content_key)
        elif len(matched) > 1:
            # pick best by unique secondary signature
            for path in matched:
                if path == "src/pages/games/CrashGame.tsx" and len(content) > 100000:
                    write_file(path, content)
                    written.append(path)
                    pending.pop(path, None)
                    seen_content.add(content_key)
                    break

    failed = list(pending.keys())
    print(json.dumps({"written": len(written), "failed": failed, "paths_written": written}))


if __name__ == "__main__":
    main()
