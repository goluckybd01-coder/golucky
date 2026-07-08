#!/usr/bin/env python3
"""Pipe batch 1 Lovable-fetched content into workspace via mcp_immediate_write."""
import json
import os
import re
import subprocess
import sys

STAGING = "/workspace/.export-tmp/corrupted_restore_batch1"
WRITE = "/workspace/tools/mcp_immediate_write.py"
WORKSPACE = "/workspace"

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

SELF_IMPORT = re.compile(
    r'^import\s+\w+\s+from\s+["\']@/(?:components|pages)(?:/[^"\']+)?/(\w+)["\']',
    re.M,
)


def stage_name(rel: str) -> str:
    return rel.replace("/", "__")


def is_corrupted(rel: str, content: str) -> bool:
    stem = os.path.splitext(os.path.basename(rel))[0]
    for m in SELF_IMPORT.finditer(content):
        if m.group(1) == stem:
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
        try:
            msg = write_one(rel, content)
            with open(os.path.join(WORKSPACE, rel), encoding="utf-8") as f:
                written = f.read()
            if is_corrupted(rel, written):
                raise RuntimeError("still self-imports after write")
            fixed += 1
            print(msg)
        except Exception as e:
            failed += 1
            failures.append({"path": rel, "error": str(e)})
            print(f"FAIL {rel}: {e}", file=sys.stderr)
    print(json.dumps({"fixed": fixed, "failed": failed, "total": len(FILES), "failures": failures}))
    return 0 if fixed == len(FILES) else 1


if __name__ == "__main__":
    raise SystemExit(main())
