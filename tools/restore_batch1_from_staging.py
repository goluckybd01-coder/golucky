#!/usr/bin/env python3
"""Restore batch 1 corrupted files from staging via mcp_immediate_write."""
import json
import os
import subprocess
import sys

STAGING = "/workspace/.export-tmp/corrupted_restore_batch1"
WRITE = "/workspace/tools/mcp_immediate_write.py"

FILES = [
    "src/components/admin/AdminAgentManagement.tsx",
    "src/components/admin/GameRevenueChart.tsx",
    "src/components/admin/TransactionStatsChart.tsx",
    "src/components/admin/UserActivityChart.tsx",
    "src/components/admin/UserRegistrationChart.tsx",
    "src/components/admin/UserRetentionChart.tsx",
    "src/components/admin/VIPDistributionChart.tsx",
    "src/components/agent/AgentCommissionAnalytics.tsx",
    "src/components/agent/AgentCommissionWithdrawHistory.tsx",
    "src/components/agent/AgentLeaderboard.tsx",
    "src/components/agent/AgentMilestoneRewards.tsx",
]


def stage_name(rel: str) -> str:
    return rel.replace("/", "__")


def self_import(rel: str, content: str) -> bool:
    base = os.path.basename(rel).replace(".tsx", "")
    for line in content.splitlines()[:80]:
        if base in line and ("@/components/" in line or "./" in line):
            if f"/{base}" in line or f"/{base}'" in line:
                return True
    return False


def main():
    fixed = failed = 0
    failures = []
    for rel in FILES:
        stage = os.path.join(STAGING, stage_name(rel))
        if not os.path.isfile(stage):
            failures.append({"path": rel, "error": "missing staging"})
            failed += 1
            print(f"MISSING {rel}", file=sys.stderr)
            continue
        with open(stage, encoding="utf-8") as f:
            content = f.read()
        if not content.strip():
            failures.append({"path": rel, "error": "empty staging"})
            failed += 1
            print(f"EMPTY {rel}", file=sys.stderr)
            continue
        r = subprocess.run(
            [sys.executable, WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode:
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
            failed += 1
            print(f"FAIL {rel}: {r.stderr or r.stdout}", file=sys.stderr)
            continue
        with open(os.path.join("/workspace", rel), encoding="utf-8") as f:
            written = f.read()
        corrupt = self_import(rel, written)
        if corrupt:
            failures.append({"path": rel, "error": "still self-imports"})
            failed += 1
            print(f"STILL_CORRUPT {rel}", file=sys.stderr)
            continue
        fixed += 1
        print((r.stdout or "").strip())
    print(json.dumps({"fixed": fixed, "failed": failed, "total": len(FILES), "failures": failures}))
    return 0 if fixed == len(FILES) else 1


if __name__ == "__main__":
    raise SystemExit(main())
