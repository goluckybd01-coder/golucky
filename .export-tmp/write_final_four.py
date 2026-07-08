#!/usr/bin/env python3
"""Write final 4 batch121 files by piping Lovable content via mcp_immediate_write."""
import json
import subprocess
import sys

WRITE = "/workspace/tools/mcp_immediate_write.py"

# Content fetched from Lovable MCP read_file
FILES = {}

def load_from_staging(name):
    return open(f"/workspace/.export-tmp/staging/{name}", encoding="utf-8").read()

MANIFEST = [
    ("src/pages/admin/__tests__/DualWalletOverview.sorting.test.tsx", "dual_wallet.test.tsx"),
    ("src/pages/admin/__tests__/GameLaunchNotifications.test.tsx", "game_launch.test.tsx"),
    ("src/services/sportsApi.ts", "sportsApi.ts"),
    ("src/stories/AviatorServerSeedField.mdx", "aviator.mdx"),
]

def main():
    written = failed = 0
    failures = []
    for rel, staging_name in MANIFEST:
        staging = f"/workspace/.export-tmp/staging/{staging_name}"
        try:
            content = open(staging, encoding="utf-8").read()
        except FileNotFoundError:
            failures.append({"path": rel, "error": f"missing staging {staging_name}"})
            failed += 1
            continue
        r = subprocess.run(["python3", WRITE, rel], input=content, text=True, capture_output=True)
        if r.returncode == 0:
            written += 1
            print(r.stdout.strip())
        else:
            failed += 1
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
    print(json.dumps({"written": written, "failed": failed, "failures": failures}))

if __name__ == "__main__":
    main()
