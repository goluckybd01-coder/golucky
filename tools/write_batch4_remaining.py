#!/usr/bin/env python3
"""Write batch 4 remaining files from embedded MCP-fetched content."""
import json
import os
import sys

WORKSPACE = "/workspace"

# Content loaded from Lovable MCP read_file calls (project a96058c7-1b97-4e98-a71b-6b6121d46efa)
FILES = {
    "src/pages/TradingPro.tsx": None,
    "src/pages/admin/AviatorGameAdmin.tsx": None,
    "src/pages/WithdrawAccounts.tsx": None,
    "src/pages/game-admin/Statistics.tsx": None,
}


def write_file(rel: str, content: str) -> None:
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")


def main():
    # Content passed via JSON file argument
    if len(sys.argv) < 2:
        print("Usage: write_batch4_remaining.py CONTENT.json", file=sys.stderr)
        sys.exit(1)
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    written, failed = [], []
    for path in FILES:
        content = data.get(path)
        if not content:
            failed.append(path)
            continue
        try:
            write_file(path, content)
            written.append(path)
            print(f"OK {path} ({len(content)} bytes)")
        except Exception as e:
            failed.append({"path": path, "error": str(e)})
            print(f"FAIL {path}: {e}")
    print(json.dumps({"written": len(written), "paths_written": written, "failed": failed}))


if __name__ == "__main__":
    main()
