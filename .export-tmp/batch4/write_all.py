#!/usr/bin/env python3
"""Write batch 4 remaining files - run after MCP content saved to sibling .content files."""
import os
import sys

WORKSPACE = "/workspace"
STAGE = os.path.dirname(os.path.abspath(__file__))
MAP = {
    "TradingPro.tsx": "src/pages/TradingPro.tsx",
    "AviatorGameAdmin.tsx": "src/pages/admin/AviatorGameAdmin.tsx",
    "WithdrawAccounts.tsx": "src/pages/WithdrawAccounts.tsx",
    "Statistics.tsx": "src/pages/game-admin/Statistics.tsx",
}

written, failed = [], []
for local, rel in MAP.items():
    src = os.path.join(STAGE, local)
    if not os.path.isfile(src):
        failed.append(rel)
        continue
    with open(src, encoding="utf-8") as f:
        content = f.read()
    if len(content) < 100 or content.strip() == "PLACEHOLDER":
        failed.append(rel)
        continue
    dst = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    with open(dst, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")
    written.append(rel)
    print(f"OK {rel} ({len(content)} bytes)")

import json
print(json.dumps({"written": len(written), "paths_written": written, "failed": failed}))
