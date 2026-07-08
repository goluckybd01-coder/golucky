#!/usr/bin/env python3
"""Write missing batch-3 files by re-reading via MCP broker subprocess."""
import json
import os
import subprocess
import sys

PROJECT_ID = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
WORKSPACE = "/workspace"

PATHS = [
    "src/pages/admin/LuckyHubAdmin.tsx",
    "src/pages/games/MotoRace.tsx",
    "src/pages/games/VideoWinGo.tsx",
    "src/pages/admin/CrashGameAdmin.tsx",
    "src/pages/admin/GameLaunchNotifications.tsx",
    "src/pages/games/MinesGame.tsx",
    "src/pages/admin/MinesGameAdmin.tsx",
    "src/pages/admin/PayoutAuditLogs.tsx",
    "src/pages/admin/UserHistory.tsx",
    "src/pages/admin/K3GameAdmin.tsx",
    "src/pages/admin/FiveDGameAdmin.tsx",
]


def write_file(rel: str, content: str) -> None:
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")


def main():
    # Content map passed as JSON file argument
    if len(sys.argv) < 2:
        print(json.dumps({"error": "usage: batch3_write_missing.py <content.json>"}))
        sys.exit(1)
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    written, failed = [], []
    for path in PATHS:
        content = data.get(path)
        if not content:
            failed.append({"path": path, "error": "missing in json"})
            continue
        try:
            write_file(path, content)
            written.append(path)
        except Exception as e:
            failed.append({"path": path, "error": str(e)})
    print(json.dumps({"written": len(written), "failed": failed, "paths_written": sorted(written)}))


if __name__ == "__main__":
    main()
