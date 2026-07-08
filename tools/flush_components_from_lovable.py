#!/usr/bin/env python3
"""Write component files from Lovable-fetched content in agent session cache."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
STAGING = os.path.join(WORKSPACE, ".export-tmp/wingo_restore_34")
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")
MANIFEST = os.path.join(WORKSPACE, ".export-tmp/wingo_batch34_manifest.json")

# Component corruption: wrong file body (game page pasted in) or injected PageScaffold header
INJECTED = (
    'import { useState, useEffect, useCallback, useRef, useMemo } from "react";\n'
    'import PageScaffold from "@/components/templates/PageScaffold";\n'
    'import { useNavigate } from "react-router-dom";\n'
)

MARKERS = {
    "src/components/game/BetPanelContent.tsx": "UNIFIED BET PANEL CONTENT",
    "src/components/game/AIPredictionHistory.tsx": "export const AIPredictionHistory",
    "src/components/game/BetSheet.tsx": "BET SHEET COMPONENT",
    "src/components/game/CrashAutoBet.tsx": "export default function CrashAutoBet",
    "src/components/game/ResultModal.tsx": "Unified Result Modal for all games",
    "src/components/game/BetHistoryChart.tsx": "export default BetHistoryChart",
}


def enc(p):
    return p.replace("/", "__")


def is_fixed(rel, content):
    if content.startswith(INJECTED):
        return False
    marker = MARKERS.get(rel)
    if marker and marker not in content:
        return False
    if rel == "src/components/game/BetPanelContent.tsx" and "import BetPanelContent from" in content:
        return False
    return True


def main():
    if not os.path.isfile(MANIFEST):
        print(f"Missing manifest: {MANIFEST}", file=sys.stderr)
        return 1
    entries = json.load(open(MANIFEST, encoding="utf-8"))
    fixed = 0
    for rel, src in entries.items():
        if not os.path.isfile(src):
            print(f"MISSING {src}", file=sys.stderr)
            continue
        content = open(src, encoding="utf-8").read()
        os.makedirs(STAGING, exist_ok=True)
        open(os.path.join(STAGING, enc(rel)), "w", encoding="utf-8").write(content)
        r = subprocess.run([sys.executable, WRITE, rel], input=content, text=True, capture_output=True)
        if r.returncode:
            print(f"FAIL {rel}: {r.stderr}", file=sys.stderr)
            continue
        if is_fixed(rel, content):
            fixed += 1
            print(f"OK {rel}")
        else:
            print(f"BAD_CONTENT {rel}", file=sys.stderr)
    print(f"FIXED={fixed}/{len(entries)}")
    return 0 if fixed == len(entries) else 1


if __name__ == "__main__":
    sys.exit(main())
