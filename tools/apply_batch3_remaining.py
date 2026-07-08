#!/usr/bin/env python3
"""Apply batch 3 remaining files from Lovable MCP content snapshots."""
import json
import os
import re
import subprocess
import sys

WRITE = "/workspace/tools/mcp_immediate_write.py"
SNAP = "/workspace/.export-tmp/batch3_snap"

FILES = [
    "src/components/wallet/AgentTransferToUserModal.tsx",
    "src/components/game/PredictionGoals.tsx",
    "src/components/game/PredictionLeaderboard.tsx",
    "src/components/game/PredictionNotifications.tsx",
    "src/components/aviator/AviatorBetPanel.tsx",
    "src/components/aviator/AviatorGamePanel.tsx",
]

GARBAGE = 'import PageScaffold from "@/components/templates/PageScaffold"'
SELF_IMPORT = re.compile(
    r'^import\s+\w+\s+from\s+["\']@/(?:components|pages)(?:/[^"\']+)?/(\w+)["\']',
    re.M,
)

def is_corrupted(rel, content):
    if GARBAGE in content:
        return True
    stem = os.path.splitext(os.path.basename(rel))[0]
    for m in SELF_IMPORT.finditer(content):
        if m.group(1) == stem:
            return True
    return False

def main():
    fixed = 0
    failures = []
    for rel in FILES:
        snap = os.path.join(SNAP, rel.replace("/", "__"))
        if not os.path.isfile(snap):
            failures.append({"path": rel, "error": "missing snapshot"})
            continue
        with open(snap, encoding="utf-8") as f:
            content = f.read()
        r = subprocess.run([sys.executable, WRITE, rel], input=content, text=True, capture_output=True)
        if r.returncode != 0:
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
            continue
        with open(os.path.join("/workspace", rel), encoding="utf-8") as f:
            written = f.read()
        if is_corrupted(rel, written):
            failures.append({"path": rel, "error": "still corrupted"})
            continue
        fixed += 1
        print(r.stdout.strip())
    print(json.dumps({"fixed": fixed, "total": len(FILES), "failures": failures}))

if __name__ == "__main__":
    main()
