#!/usr/bin/env python3
"""Concat part files and apply via mcp_immediate_write.py"""
import glob, os, subprocess, sys

WRITE = "/workspace/tools/mcp_immediate_write.py"
PARTS = "/workspace/.export-tmp/parts"

JOBS = [
    ("gamehistory", "src/pages/GameHistory.tsx", 3),
    ("leaderboard", "src/pages/Leaderboard.tsx", 3),
    ("bethistoryfilters", "src/components/game/BetHistoryFilters.tsx", 3),
]

def apply(name, rel, n):
    parts = [open(os.path.join(PARTS, f"{name}_part{i}.tsx"), encoding="utf-8").read() for i in range(1, n+1)]
    content = "".join(parts)
    stage = os.path.join("/workspace/.export-tmp/fetch_batch40", rel.replace("/", "__"))
    os.makedirs(os.path.dirname(stage), exist_ok=True)
    open(stage, "w", encoding="utf-8").write(content)
    r = subprocess.run([sys.executable, WRITE, rel], input=content, text=True, capture_output=True)
    if r.returncode:
        raise RuntimeError(r.stderr or r.stdout)
    print(r.stdout.strip(), f"({len(content)} bytes)")

if __name__ == "__main__":
    for name, rel, n in JOBS:
        try:
            apply(name, rel, n)
        except Exception as e:
            print(f"SKIP {rel}: {e}", file=sys.stderr)
