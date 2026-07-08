#!/usr/bin/env python3
"""
Automated Lovable export loop helper.
Prints next batch paths; after agent writes files, run with --count to show progress.

Usage:
  python3 export_autoloop.py status
  python3 export_autoloop.py next 25
  python3 export_autoloop.py corrupt
"""
import json
import os
import sys

WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"


def load_pending():
    return json.load(open(PENDING, encoding="utf-8"))


def pending_src_paths(data):
    return [
        p
        for p in data.get("pending_src_paths", [])
        if not os.path.isfile(os.path.join(WORKSPACE, p))
    ]


def is_corrupted_tsx(path: str) -> bool:
    if not path.endswith(".tsx"):
        return False
    full = os.path.join(WORKSPACE, path)
    if not os.path.isfile(full):
        return False
    with open(full, encoding="utf-8", errors="replace") as f:
        head = f.read(200).lstrip()
    if head.startswith("@import") or head.startswith("@tailwind"):
        return True
    if head.startswith("{") or head.startswith("Lovable MCP"):
        return True
    if "Lovable MCP Server" in head[:500]:
        return True
    return False


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    cmd = sys.argv[1]
    data = load_pending()
    ps = pending_src_paths(data)

    if cmd == "status":
        corrupt = [p for p in data.get("pending_src_paths", []) if is_corrupted_tsx(p)]
        existing = len(data.get("pending_src_paths", [])) - len(ps)
        print(
            json.dumps(
                {
                    "pending_src": len(ps),
                    "exported_src": existing,
                    "corrupted_tsx": len(corrupt),
                    "pending_critical": len(
                        [
                            p
                            for p in data.get("pending_critical_paths", [])
                            if not os.path.isfile(os.path.join(WORKSPACE, p))
                        ]
                    ),
                },
                indent=2,
            )
        )
    elif cmd == "next":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 25
        print(json.dumps(ps[:n]))
    elif cmd == "corrupt":
        corrupt = [
            p
            for p in data.get("pending_src_paths", [])
            if os.path.isfile(os.path.join(WORKSPACE, p)) and is_corrupted_tsx(p)
        ]
        # Also scan existing src tsx
        for root, _, files in os.walk(os.path.join(WORKSPACE, "src")):
            for f in files:
                if f.endswith(".tsx"):
                    rel = os.path.relpath(os.path.join(root, f), WORKSPACE).replace("\\", "/")
                    if is_corrupted_tsx(rel) and rel not in corrupt:
                        corrupt.append(rel)
        print(json.dumps(corrupt))
    else:
        print(f"Unknown: {cmd}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
