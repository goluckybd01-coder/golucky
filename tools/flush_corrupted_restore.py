#!/usr/bin/env python3
"""Flush .export-tmp/corrupted_restore/* via mcp_immediate_write.py."""
import os
import subprocess
import sys

STAGING = "/workspace/.export-tmp/corrupted_restore"
WRITE = "/workspace/tools/mcp_immediate_write.py"

PATHS = [
    "src/pages/DepositCentre.tsx",
    "src/pages/Install.tsx",
    "src/pages/Feedback.tsx",
    "src/pages/Account.tsx",
    "src/pages/Privacy.tsx",
    "src/pages/Support.tsx",
    "src/components/admin/RolePermissionManager.tsx",
    "src/components/ui/form.tsx",
    "src/components/ui/toggle.tsx",
    "src/components/withdraw/WithdrawBackground.tsx",
    "src/lib/adminAuthStore.ts",
    "src/lib/adminPermissions.ts",
    "src/lib/payout.ts",
    "src/lib/rate.ts",
    "src/lib/currency.ts",
    "src/hooks/useWallet.ts",
]


def enc(path: str) -> str:
    return path.replace("/", "__")


def main():
    written = failed = 0
    failures = []
    for path in PATHS:
        stage = os.path.join(STAGING, enc(path))
        if not os.path.isfile(stage):
            failures.append({"path": path, "error": "missing staging file"})
            failed += 1
            continue
        content = open(stage, encoding="utf-8").read()
        if not content.strip():
            failures.append({"path": path, "error": "empty staging file"})
            failed += 1
            continue
        r = subprocess.run(
            [sys.executable, WRITE, path],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode:
            failed += 1
            failures.append({"path": path, "error": (r.stderr or r.stdout).strip()})
        else:
            written += 1
            print(r.stdout.strip())
    import json
    print(json.dumps({"written": written, "failed": failed, "failures": failures}, indent=2))
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
