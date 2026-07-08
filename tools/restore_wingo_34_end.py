#!/usr/bin/env python3
"""Restore wingo_corrupted.json indices 34-end via staged Lovable reads + mcp_immediate_write.py."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
PATHS_FILE = os.path.join(WORKSPACE, ".export-tmp/wingo_corrupted.json")
STAGING = os.path.join(WORKSPACE, ".export-tmp/wingo_restore_34")
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")

CORRUPTED_HEAD = 'import PageScaffold from "@/components/templates/PageScaffold"'

# Files that legitimately use PageScaffold (game pages / example)
LEGIT_PAGE_SCAFFOLD = {
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


def load_paths():
    with open(PATHS_FILE, encoding="utf-8") as f:
        lines = [ln.strip() for ln in f if ln.strip()]
    if lines and lines[0].isdigit():
        lines = lines[1:]
    paths = []
    for ln in lines:
        ln = ln.strip().rstrip(",").strip()
        if ln.startswith('"') and ln.endswith('"'):
            paths.append(json.loads(ln))
        elif ln in ("[", "]"):
            continue
    return paths[34:]


def enc(path: str) -> str:
    return path.replace("/", "__")


def write_file(rel: str, content: str) -> None:
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode:
        raise RuntimeError((r.stderr or r.stdout).strip())


def verify(rel: str) -> bool:
    full = os.path.join(WORKSPACE, rel)
    if not os.path.isfile(full):
        return False
    with open(full, encoding="utf-8") as f:
        head = f.read(500)
    if rel in LEGIT_PAGE_SCAFFOLD:
        return CORRUPTED_HEAD in head or "PageScaffold" in head
    return CORRUPTED_HEAD not in head


def main():
    paths = load_paths()
    fixed = 0
    failures = []
    for rel in paths:
        stage = os.path.join(STAGING, enc(rel))
        if not os.path.isfile(stage):
            failures.append({"path": rel, "error": "missing staging file"})
            continue
        content = open(stage, encoding="utf-8").read()
        if not content.strip():
            failures.append({"path": rel, "error": "empty staging file"})
            continue
        try:
            write_file(rel, content)
            if verify(rel):
                fixed += 1
                print(f"OK {rel}")
            else:
                failures.append({"path": rel, "error": "verify failed after write"})
        except Exception as e:
            failures.append({"path": rel, "error": str(e)})
    result = {"fixed": fixed, "total": len(paths), "failures": failures}
    print(json.dumps(result, indent=2))
    return 0 if fixed == len(paths) else 1


if __name__ == "__main__":
    sys.exit(main())
