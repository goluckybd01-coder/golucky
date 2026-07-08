#!/usr/bin/env python3
"""Match agent-tools MCP outputs to 15 corrupted paths and write via mcp_immediate_write."""
import glob
import json
import os
import re
import subprocess
import sys

TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
WORKSPACE = "/workspace"
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")
STAGING = os.path.join(WORKSPACE, ".export-tmp/corrupted_restore_15")

PATHS = [
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


def enc(rel: str) -> str:
    return rel.replace("/", "__")


def basename_stem(path: str) -> str:
    return os.path.splitext(os.path.basename(path))[0]


def is_valid_source(content: str) -> bool:
    if not content or len(content) < 80:
        return False
    if content.startswith("{") and ("pagination" in content[:500] or '"data"' in content[:300]):
        return False
    if "Lovable API error" in content[:200]:
        return False
    head = content.lstrip()[:30]
    if head.startswith("@import") or head.startswith("@tailwind"):
        return False
    return True


def match_path(content: str, path: str) -> bool:
    if not is_valid_source(content):
        return False
    stem = basename_stem(path)
    patterns = [
        rf"export\s+default\s+function\s+{re.escape(stem)}\b",
        rf"export\s+function\s+{re.escape(stem)}\b",
        rf"export\s+const\s+{re.escape(stem)}\b",
        rf"export\s+default\s+{re.escape(stem)}\b",
        rf"const\s+{re.escape(stem)}\s*=",
        rf"function\s+{re.escape(stem)}\b",
    ]
    for pat in patterns:
        if re.search(pat, content):
            return True
    if stem == "GameMonitorPanel" and "export const GameMonitorPanel" in content:
        return True
    return False


def write_one(rel: str, content: str) -> str:
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout).strip())
    return (r.stdout or "").strip()


def main():
    remaining = set(PATHS)
    fixed = 0
    failures = []
    matched = []
    seen: set[str] = set()

    # staged copies first
    for rel in list(remaining):
        stage = os.path.join(STAGING, enc(rel))
        if os.path.isfile(stage):
            try:
                with open(stage, encoding="utf-8") as f:
                    content = f.read()
                msg = write_one(rel, content)
                remaining.discard(rel)
                matched.append(rel)
                fixed += 1
                print(msg)
            except Exception as e:
                failures.append({"path": rel, "error": str(e)})

    tool_files = sorted(glob.glob(os.path.join(TOOLS, "*.txt")), key=os.path.getmtime, reverse=True)
    for tf in tool_files:
        if not remaining:
            break
        with open(tf, encoding="utf-8", errors="replace") as f:
            content = f.read().strip()
        if not content or content in seen:
            continue
        seen.add(content)
        hits = [p for p in list(remaining) if match_path(content, p)]
        if len(hits) != 1:
            continue
        path = hits[0]
        try:
            msg = write_one(path, content)
            remaining.discard(path)
            matched.append(path)
            fixed += 1
            print(msg)
        except Exception as e:
            failures.append({"path": path, "error": str(e)})

    print(json.dumps({
        "fixed": fixed,
        "total": len(PATHS),
        "matched": matched,
        "remaining": sorted(remaining),
        "failures": failures,
    }, indent=2))
    return 0 if not remaining else 1


if __name__ == "__main__":
    sys.exit(main())
