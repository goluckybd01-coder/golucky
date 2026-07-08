#!/usr/bin/env python3
"""Restore wingo batch34 (indices 34-end) from Lovable sources via mcp_immediate_write."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
STAGING = os.path.join(WORKSPACE, ".export-tmp/wingo_restore_34")
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")
PATHS_FILE = os.path.join(WORKSPACE, ".export-tmp/wingo_corrupted.json")
AGENT = "/home/ubuntu/.cursor/projects/workspace/agent-tools"

# Corruption: injected scaffold header after generic react import
INJECTED_REACT = (
    "import { useState, useEffect, useCallback, useRef, useMemo } from \"react\";\n"
    "import PageScaffold from \"@/components/templates/PageScaffold\";\n"
    "import { useNavigate } from \"react-router-dom\";\n"
)
INJECTED_REACT_REACT = (
    "import React, { useState, useEffect, useCallback, useRef, useMemo } from \"react\";\n"
    "import PageScaffold from \"@/components/templates/PageScaffold\";\n"
    "import { useNavigate } from \"react-router-dom\";\n"
)

LARGE = {
    "src/pages/games/AviatorGame.tsx": f"{AGENT}/cee7b38a-5673-4cf3-a3fb-c07eddfa8d63.txt",
    "src/pages/games/K3.tsx": f"{AGENT}/aa504086-68d9-4866-bc84-323280e1448c.txt",
    "src/pages/games/FiveD.tsx": f"{AGENT}/95ba40f0-15b8-4da3-a856-80de64a955ba.txt",
    "src/pages/games/TrxWin.tsx": f"{AGENT}/08f88554-0e1a-4f9a-9199-3e87ec5a3e5e.txt",
    "src/pages/games/CrashGame.tsx": f"{AGENT}/8407da09-8d33-40ff-a49f-57a4399f5078.txt",
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
    return None


def is_corrupted(content: str) -> bool:
    if content.startswith(INJECTED_REACT):
        return True
    if content.startswith(INJECTED_REACT_REACT):
        return True
    if content.startswith("import React, { useState, useEffect, useCallback, useRef, forwardRef, useMemo }"):
        nxt = content.split("\n", 3)[:3]
        if len(nxt) >= 2 and "PageScaffold" in nxt[1] and "useNavigate" in (nxt[2] if len(nxt) > 2 else ""):
            return True
    if content.startswith("import { useState, useEffect, useRef, useCallback }"):
        nxt = content.split("\n", 3)[:3]
        if len(nxt) >= 2 and "PageScaffold" in nxt[1]:
            return True
    return False


def write_file(rel, content):
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    return r.returncode == 0, r.stderr.strip()


def main():
    paths = load_paths()
    fixed = 0
    for rel in paths:
        src = source_for(rel)
        if not src:
            print(f"SKIP_NO_SOURCE {rel}", file=sys.stderr)
            continue
        content = open(src, encoding="utf-8").read()
        before = open(os.path.join(WORKSPACE, rel), encoding="utf-8").read() if os.path.isfile(os.path.join(WORKSPACE, rel)) else ""
        ok, err = write_file(rel, content)
        if not ok:
            print(f"FAIL {rel}: {err}", file=sys.stderr)
            continue
        after = open(os.path.join(WORKSPACE, rel), encoding="utf-8").read()
        if is_corrupted(after):
            print(f"STILL_CORRUPT {rel}", file=sys.stderr)
            continue
        if before != after or not is_corrupted(before):
            fixed += 1
            print(f"OK {rel}")
        else:
            print(f"UNCHANGED {rel}")
    print(f"FIXED={fixed}/{len(paths)}")
    return 0 if fixed >= 6 else 1


if __name__ == "__main__":
    sys.exit(main())
