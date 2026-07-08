#!/usr/bin/env python3
"""Pipe staged Lovable content into workspace via mcp_immediate_write.py."""
import os
import subprocess
import sys

STAGING = "/workspace/.export-tmp/corrupted_restore_batch0"
WRITE = "/workspace/tools/mcp_immediate_write.py"
MARKER = 'import PageScaffold from "@/components/templates/PageScaffold"'

PATHS = [
    "src/components/WinAmountDisplay.tsx",
    "src/components/MainLayout.tsx",
    "src/lib/gameEngineBase.ts",
    "src/lib/gameStorage.ts",
    "src/lib/gameHistoryService.ts",
]


def enc(rel: str) -> str:
    return rel.replace("/", "__")


def main():
    fixed = 0
    for rel in PATHS:
        stage = os.path.join(STAGING, enc(rel))
        if not os.path.isfile(stage):
            print(f"MISSING {rel}", file=sys.stderr)
            continue
        content = open(stage, encoding="utf-8").read()
        if not content.strip():
            print(f"EMPTY {rel}", file=sys.stderr)
            continue
        r = subprocess.run(
            [sys.executable, WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode:
            print(f"FAIL {rel}: {r.stderr or r.stdout}", file=sys.stderr)
            continue
        bad = MARKER in open(os.path.join("/workspace", rel), encoding="utf-8").read()
        lines = content.count("\n") + (0 if content.endswith("\n") else 1)
        print(f"OK {rel} ({lines} lines, corrupted={bad})")
        if not bad:
            fixed += 1
    print(f"PIPE_FIXED={fixed}/{len(PATHS)}")
    return 0 if fixed == len(PATHS) else 1


if __name__ == "__main__":
    sys.exit(main())
