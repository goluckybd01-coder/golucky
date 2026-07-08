#!/usr/bin/env python3
"""Fetch batch4 files from Lovable via cursor MCP broker and write to workspace."""
import json
import os
import subprocess
import sys

PROJECT_ID = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
WORKSPACE = "/workspace"

PATHS = [
    "src/pages/TradingPro.tsx",
    "src/pages/WithdrawAccounts.tsx",
]


def fetch_via_curl(path: str) -> str | None:
    """Try HTTP MCP if available."""
    return None


def main():
    # Content files passed as JSON map path -> content_file
    if len(sys.argv) < 2:
        print("Usage: sync_mcp_batch4.py <json_map>", file=sys.stderr)
        sys.exit(1)
    mapping = json.load(open(sys.argv[1], encoding="utf-8"))
    written = []
    failed = []
    for rel, src in mapping.items():
        try:
            with open(src, encoding="utf-8") as f:
                content = f.read()
            if not content.strip() or content.startswith("Lovable API error"):
                raise ValueError("empty or error content")
            dest = os.path.join(WORKSPACE, rel)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with open(dest, "w", encoding="utf-8", newline="\n") as f:
                f.write(content)
                if not content.endswith("\n"):
                    f.write("\n")
            written.append(rel)
            print(f"OK {rel} ({len(content)} bytes)")
        except Exception as e:
            failed.append({"path": rel, "error": str(e)})
            print(f"FAIL {rel}: {e}", file=sys.stderr)
    print(json.dumps({"written": len(written), "failed": failed, "paths_written": written}))


if __name__ == "__main__":
    main()
