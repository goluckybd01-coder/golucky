#!/usr/bin/env python3
"""Apply batch 2 staged Lovable files via mcp_immediate_write.py."""
import json
import os
import subprocess
import sys

STAGING = "/workspace/.export-tmp/batch2"
WRITE = "/workspace/tools/mcp_immediate_write.py"
WORKSPACE = "/workspace"

MAPPING = {
    "AgentNotificationPanel.tsx": "src/components/agent/AgentNotificationPanel.tsx",
    "AgentPerformanceAnalytics.tsx": "src/components/agent/AgentPerformanceAnalytics.tsx",
    "AgentQRCode.tsx": "src/components/agent/AgentQRCode.tsx",
    "AgentSalarySystem.tsx": "src/components/agent/AgentSalarySystem.tsx",
    "AgentSessionHistory.tsx": "src/components/agent/AgentSessionHistory.tsx",
    "AgentTeamHierarchy.tsx": "src/components/agent/AgentTeamHierarchy.tsx",
    "AgentTopupLog.tsx": "src/components/agent/AgentTopupLog.tsx",
    "LogoMark3D.tsx": "src/components/auth-premium/LogoMark3D.tsx",
    "LuxeButton.tsx": "src/components/auth-premium/LuxeButton.tsx",
    "LuxeInput.tsx": "src/components/auth-premium/LuxeInput.tsx",
    "LuxuryBackground.tsx": "src/components/auth-premium/LuxuryBackground.tsx",
}

CORRUPTED_MARKERS = (
    "useNavigate, useSearchParams",
    "User as UserIcon",
)


def is_corrupted(rel: str, content: str) -> bool:
    if rel.startswith("src/components/agent/") and "useNavigate, useSearchParams" in content[:300]:
        return True
    if rel.startswith("src/components/auth-premium/") and "User as UserIcon" in content[:300]:
        return True
    return False


def main():
    fixed = 0
    failures = []
    for stage_name, rel in MAPPING.items():
        stage = os.path.join(STAGING, stage_name)
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
    print(json.dumps({"fixed": fixed, "total": len(MAPPING), "failures": failures}, indent=2))
    return 0 if fixed == len(MAPPING) else 1


if __name__ == "__main__":
    sys.exit(main())
