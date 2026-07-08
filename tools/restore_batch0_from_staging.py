#!/usr/bin/env python3
"""Flush staged Lovable content via mcp_immediate_write and verify."""
import os
import subprocess
import sys

STAGING = "/workspace/.export-tmp/corrupted_restore_batch0"
WRITE = "/workspace/tools/mcp_immediate_write.py"
CORRUPTED = 'import PageScaffold from "@/components/templates/PageScaffold"'
WINGO = "src/pages/games/WinGo.tsx"

PATHS = [
    "src/components/WinAmountDisplay.tsx",
    "src/components/MainLayout.tsx",
    "src/lib/gameEngineBase.ts",
    "src/lib/gameStorage.ts",
    "src/lib/gameHistoryService.ts",
    "src/lib/houseEdgeResult.ts",
    "src/lib/fiveDChartStats.ts",
]


def enc(path: str) -> str:
    return path.replace("/", "__")


def verify(rel: str) -> bool:
    with open(os.path.join("/workspace", rel), encoding="utf-8") as f:
        content = f.read()
    if CORRUPTED in content and rel != WINGO:
        return False
    return True


def main():
    fixed = 0
    failures = []
    for rel in PATHS:
        stage = os.path.join(STAGING, enc(rel))
        if not os.path.isfile(stage):
            failures.append({"path": rel, "error": "missing staging"})
            continue
        content = open(stage, encoding="utf-8").read()
        r = subprocess.run(
            [sys.executable, WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode:
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
            continue
        if verify(rel):
            fixed += 1
            print(f"OK {rel}")
        else:
            failures.append({"path": rel, "error": "still has PageScaffold"})
    import json
    print(json.dumps({"fixed": fixed, "failures": failures}, indent=2))
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
