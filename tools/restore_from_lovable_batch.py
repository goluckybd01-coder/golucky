#!/usr/bin/env python3
"""Restore files from Lovable staging via mcp_immediate_write.py."""
import subprocess
import sys

STAGING = "/workspace/.export-tmp/corrupted_restore_batch0"
WRITE = "/workspace/tools/mcp_immediate_write.py"

FILES = [
    "src/components/WinAmountDisplay.tsx",
    "src/components/MainLayout.tsx",
    "src/lib/gameEngineBase.ts",
    "src/lib/gameStorage.ts",
    "src/lib/gameHistoryService.ts",
    "src/lib/fiveDChartStats.ts",
]

MARKER = 'import PageScaffold from "@/components/templates/PageScaffold"'


def stage_name(rel: str) -> str:
    return rel.replace("/", "__")


def main():
    ok = 0
    for rel in FILES:
        stage = f"{STAGING}/{stage_name(rel)}"
        try:
            with open(stage, encoding="utf-8") as f:
                content = f.read()
        except FileNotFoundError:
            print(f"SKIP missing staging: {rel}")
            continue
        if not content.strip():
            print(f"SKIP empty staging: {rel}")
            continue
        r = subprocess.run(
            [sys.executable, WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode:
            print(f"FAIL {rel}: {r.stderr or r.stdout}")
            continue
        with open(f"/workspace/{rel}", encoding="utf-8") as f:
            written = f.read()
        bad = MARKER in written
        print(f"OK {rel} ({len(written)} bytes, corrupted={bad})")
        if not bad:
            ok += 1
    print(f"RESTORED_CLEAN={ok}/{len(FILES)}")
    return 0 if ok == len(FILES) else 1


if __name__ == "__main__":
    raise SystemExit(main())
