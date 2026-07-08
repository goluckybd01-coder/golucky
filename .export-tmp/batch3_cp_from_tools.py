#!/usr/bin/env python3
"""Copy MCP-spilled agent-tools files to workspace by signature matching."""
import glob
import json
import os
import shutil

WORKSPACE = "/workspace"
TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"

MISSING = [
    "src/pages/admin/ReportsAnalytics.tsx",
    "src/pages/admin/LuckyHubAdmin.tsx",
    "src/pages/games/MotoRace.tsx",
    "src/pages/games/VideoWinGo.tsx",
    "src/pages/settings/BadgeSettings.tsx",
    "src/pages/admin/CrashGameAdmin.tsx",
    "src/pages/admin/GameLaunchNotifications.tsx",
    "src/pages/games/MinesGame.tsx",
    "src/pages/admin/MinesGameAdmin.tsx",
    "src/pages/admin/PayoutAuditLogs.tsx",
    "src/pages/admin/UserHistory.tsx",
    "src/pages/admin/K3GameAdmin.tsx",
    "src/pages/admin/FiveDGameAdmin.tsx",
]

SIGNATURES = {
    "src/pages/admin/ReportsAnalytics.tsx": "export default function ReportsAnalytics",
    "src/pages/admin/LuckyHubAdmin.tsx": "export default function LuckyHubAdmin",
    "src/pages/games/MotoRace.tsx": 'const GAME_KEY = "motorace"',
    "src/pages/games/VideoWinGo.tsx": 'const GAME_KEY = "videoWingo"',
    "src/pages/settings/BadgeSettings.tsx": "export default function BadgeSettings",
    "src/pages/admin/CrashGameAdmin.tsx": "const CrashGameAdmin = ()",
    "src/pages/admin/GameLaunchNotifications.tsx": "mapSignupsWithProfiles",
    "src/pages/games/MinesGame.tsx": "const MinesGame = ()",
    "src/pages/admin/MinesGameAdmin.tsx": "const MinesGameAdmin = ()",
    "src/pages/admin/PayoutAuditLogs.tsx": "Large Payout Audit Logs",
    "src/pages/admin/UserHistory.tsx": "exportUserTransactions",
    "src/pages/admin/K3GameAdmin.tsx": "const K3GameAdmin = ()",
    "src/pages/admin/FiveDGameAdmin.tsx": "const FiveDGameAdmin = ()",
}

pending = {p: SIGNATURES[p] for p in MISSING if not os.path.isfile(os.path.join(WORKSPACE, p))}
written = []
seen = set()

for tf in sorted(glob.glob(os.path.join(TOOLS, "*.txt")), key=os.path.getmtime, reverse=True):
    try:
        content = open(tf, encoding="utf-8", errors="replace").read()
    except OSError:
        continue
    if len(content) < 200 or content.startswith("Lovable API error"):
        continue
    key = (content[:120], len(content))
    if key in seen:
        continue
    hits = [p for p, sig in pending.items() if sig in content]
    if len(hits) == 1:
        path = hits[0]
        dest = os.path.join(WORKSPACE, path)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copy2(tf, dest)
        written.append(path)
        del pending[path]
        seen.add(key)

print(json.dumps({"written": len(written), "paths_written": written, "still_missing": list(pending.keys())}))
