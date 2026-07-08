#!/usr/bin/env python3
"""Flush all batch34 paths: pipe staging or already-fixed sources through mcp_immediate_write."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
STAGING = os.path.join(WORKSPACE, ".export-tmp/wingo_restore_34")
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")
PATHS_FILE = os.path.join(WORKSPACE, ".export-tmp/wingo_corrupted.json")
CORRUPTED = 'import PageScaffold from "@/components/templates/PageScaffold"'
LEGIT = {
    "src/components/templates/ExamplePage.tsx",
    "src/pages/games/AviatorGame.tsx",
    "src/pages/games/VideoWinGo.tsx",
    "src/pages/games/MotoRace.tsx",
    "src/pages/games/K3.tsx",
    "src/pages/games/FiveD.tsx",
    "src/pages/games/TrxWin.tsx",
    "src/pages/games/MinesGame.tsx",
    "src/pages/games/CrashGame.tsx",
}

AGENT = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
LARGE = {
    "src/pages/games/AviatorGame.tsx": f"{AGENT}/ff38265e-d159-4984-ba05-6ff459f71ce8.txt",
    "src/pages/games/K3.tsx": f"{AGENT}/1713929c-a8dc-448a-a45a-e4edcdefcdb4.txt",
    "src/pages/games/FiveD.tsx": f"{AGENT}/d7192dd9-7ea9-43f8-838a-ac7ac18eeb41.txt",
    "src/pages/games/TrxWin.tsx": f"{AGENT}/f62732e7-8fe0-47b0-b3bd-48f7a280445f.txt",
    "src/pages/games/CrashGame.tsx": f"{AGENT}/a78fa909-f0e6-4856-8ecb-b344b35a1b79.txt",
}


def load_paths():
    lines = open(PATHS_FILE, encoding="utf-8").read().splitlines()
    lines = [ln.strip() for ln in lines if ln.strip()]
    if lines and lines[0].isdigit():
        lines = lines[1:]
    paths = []
    for ln in lines:
        ln = ln.strip().rstrip(",").strip()
        if ln in ("[", "]"):
            continue
        if ln.startswith('"'):
            paths.append(json.loads(ln))
    return paths[34:]


def enc(p):
    return p.replace("/", "__")


def source_for(rel):
    if rel in LARGE and os.path.isfile(LARGE[rel]):
        return LARGE[rel]
    stage = os.path.join(STAGING, enc(rel))
    if os.path.isfile(stage):
        return stage
    full = os.path.join(WORKSPACE, rel)
    if os.path.isfile(full):
        return full
    return None


def verify(rel):
    head = open(os.path.join(WORKSPACE, rel), encoding="utf-8").read(500)
    if rel in LEGIT:
        return "PageScaffold" in head
    return CORRUPTED not in head


def main():
    paths = load_paths()
    fixed = 0
    for rel in paths:
        src = source_for(rel)
        if not src:
            print(f"MISSING {rel}", file=sys.stderr)
            continue
        content = open(src, encoding="utf-8").read()
        r = subprocess.run([sys.executable, WRITE, rel], input=content, text=True, capture_output=True)
        if r.returncode:
            print(f"FAIL {rel}: {r.stderr}", file=sys.stderr)
            continue
        if verify(rel):
            fixed += 1
            print(f"OK {rel}")
        else:
            print(f"VERIFY_FAIL {rel}", file=sys.stderr)
    print(f"FIXED={fixed}/{len(paths)}")
    return 0 if fixed == len(paths) else 1


if __name__ == "__main__":
    sys.exit(main())
