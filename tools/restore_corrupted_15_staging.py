#!/usr/bin/env python3
"""Write staged Lovable files via mcp_immediate_write.py."""
import json
import os
import re
import subprocess
import sys

STAGING = "/workspace/.export-tmp/corrupted_restore_15"
WRITE = "/workspace/tools/mcp_immediate_write.py"
WORKSPACE = "/workspace"

FILES = [
    "src/components/BottomNav.tsx",
    "src/components/CommissionDetailsModal.tsx",
    "src/components/Confetti.tsx",
    "src/components/InvitationRulesModal.tsx",
    "src/components/ReferralShareCard.tsx",
    "src/components/SubordinateDataModal.tsx",
    "src/components/TransactionDetailsModal.tsx",
    "src/components/TransactionRequestForm.tsx",
    "src/components/admin/AdminAgentCommissionOverview.tsx",
    "src/components/admin/AdminAviatorLiveMonitor.tsx",
    "src/components/admin/LiveBetsPanel.tsx",
    "src/components/admin/game-monitor/GameMonitorPanel.tsx",
    "src/pages/FixedDeposits.tsx",
    "src/pages/Popular.tsx",
    "src/pages/admin/MinesGameAdmin.tsx",
]

SELF_IMPORT = re.compile(
    r'^import\s+(\w+)\s+from\s+["\']@/(?:components|pages)(?:/[^"\']+)?/\1["\']',
    re.M,
)
GARBAGE_MARKERS = (
    'import PageScaffold from "@/components/templates/PageScaffold"',
    "useAdminSounds",
    "LayoutDashboard",
)


def enc(rel: str) -> str:
    return rel.replace("/", "__")


def is_corrupted(rel: str, content: str) -> bool:
    stem = os.path.splitext(os.path.basename(rel))[0]
    if any(m in content for m in GARBAGE_MARKERS):
        if rel.endswith("Confetti.tsx") and "useAdminSounds" in content:
            return True
        if rel.endswith("CommissionDetailsModal.tsx") and "useNavigate" in content[:500]:
            return True
    for m in SELF_IMPORT.finditer(content):
        if m.group(1) == stem:
            return True
    if rel.endswith("Popular.tsx") and "type Plan =" in content:
        return True
    if rel.endswith("GameMonitorPanel.tsx") and "interface GameSession" in content:
        return True
    return False


def main():
    fixed = 0
    failures = []
    for rel in FILES:
        stage = os.path.join(STAGING, enc(rel))
        if not os.path.isfile(stage):
            failures.append({"path": rel, "error": f"missing staging: {stage}"})
            continue
        with open(stage, encoding="utf-8") as f:
            content = f.read()
        if not content.strip():
            failures.append({"path": rel, "error": "empty staging"})
            continue
        r = subprocess.run(
            [sys.executable, WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode != 0:
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
            continue
        with open(os.path.join(WORKSPACE, rel), encoding="utf-8") as f:
            written = f.read()
        if is_corrupted(rel, written):
            failures.append({"path": rel, "error": "still corrupted after write"})
            continue
        fixed += 1
        print(r.stdout.strip())
    print(json.dumps({"fixed": fixed, "total": len(FILES), "failures": failures}, indent=2))
    return 0 if fixed == len(FILES) else 1


if __name__ == "__main__":
    sys.exit(main())
