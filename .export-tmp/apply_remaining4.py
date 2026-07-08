#!/usr/bin/env python3
"""Apply remaining wingo files from fetch_batch40 staging via mcp_immediate_write."""
import json
import subprocess
import sys
from pathlib import Path

FETCH = Path("/workspace/.export-tmp/fetch_batch40")
WRITE = "/workspace/tools/mcp_immediate_write.py"

REMAINING = [
    "src/pages/GameHistory.tsx",
    "src/pages/Leaderboard.tsx",
    "src/components/game/FiveDSlotMachine.tsx",
    "src/components/game/BetHistoryFilters.tsx",
]

def enc(p): return p.replace("/", "__")

def main():
    written = []
    failed = []
    for rel in REMAINING:
        stage = FETCH / enc(rel)
        if not stage.is_file():
            failed.append({"path": rel, "error": "missing staging"})
            continue
        content = stage.read_text(encoding="utf-8")
        r = subprocess.run([sys.executable, WRITE, rel], input=content, text=True, capture_output=True)
        if r.returncode:
            failed.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
        else:
            written.append(rel)
            print(r.stdout.strip())
    print(json.dumps({"written": written, "failed": failed}))

if __name__ == "__main__":
    main()
