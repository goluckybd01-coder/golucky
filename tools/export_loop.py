#!/usr/bin/env python3
"""
Agent export loop helper.
Usage:
  python3 export_loop.py status
  python3 export_loop.py next [N]
  python3 export_loop.py written REL_PATH
  python3 export_loop.py corrupt
"""
import json
import os
import sys

WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"
STATE = "/workspace/.export-tmp/export_state.json"


def load_pending():
    data = json.load(open(PENDING, encoding="utf-8"))
    return [p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))]


def cmd_status():
    missing = load_pending()
    corrupt = []
    for root, _, files in os.walk(os.path.join(WORKSPACE, "src")):
        for f in files:
            if not f.endswith(".tsx"):
                continue
            path = os.path.join(root, f)
            rel = os.path.relpath(path, WORKSPACE).replace("\\", "/")
            try:
                head = open(path, encoding="utf-8", errors="replace").read(200).lstrip()
            except OSError:
                continue
            if head.startswith("@import") or head.startswith("@tailwind"):
                corrupt.append(rel)
            elif head.startswith("{") and '"data"' in head[:300]:
                corrupt.append(rel)
    print(json.dumps({"pending_src": len(missing), "corrupted_tsx": len(corrupt), "corrupt": corrupt[:20]}))


def cmd_next(n=25):
    missing = load_pending()
    print(json.dumps(missing[:n]))


def cmd_written(rel):
    state = {"written": []}
    if os.path.isfile(STATE):
        state = json.load(open(STATE, encoding="utf-8"))
    if rel not in state["written"]:
        state["written"].append(rel)
    with open(STATE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)
    cmd_status()


def main():
    if len(sys.argv) < 2:
        print("Usage: export_loop.py status|next|written|corrupt", file=sys.stderr)
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == "status":
        cmd_status()
    elif cmd == "next":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 25
        cmd_next(n)
    elif cmd == "written":
        cmd_written(sys.argv[2])
    elif cmd == "corrupt":
        cmd_status()
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
