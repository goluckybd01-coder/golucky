#!/usr/bin/env python3
"""
Auto export runner - writes paths needing export for agent MCP cycles.
Prints JSON batches; agent CallMcpTool read_file + Write each path.

Usage:
  python3 auto_export_runner.py batch 25   # next 25 paths as JSON array
  python3 auto_export_runner.py all        # all pending paths
  python3 auto_export_runner.py status
"""
import json
import os
import sys

WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"


def pending_src():
    data = json.load(open(PENDING, encoding="utf-8"))
    return [p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))]


def pending_critical():
    data = json.load(open(PENDING, encoding="utf-8"))
    out = []
    for p in data.get("pending") or []:
        if p.startswith("supabase/migrations/") and p.endswith(".sql"):
            out.append(p)
        elif p.startswith("scripts/"):
            out.append(p)
        elif p in (
            "src/context/WalletContext.tsx",
            "src/lib/featureFlags.ts",
            "src/lib/supabaseClient.ts",
        ):
            out.append(p)
    return [p for p in out if not os.path.isfile(os.path.join(WORKSPACE, p))]


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "status":
        ps, pc = pending_src(), pending_critical()
        print(json.dumps({"pending_src": len(ps), "pending_critical": len(pc), "done": len(ps) < 10}))
    elif cmd == "batch":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 25
        print(json.dumps(pending_src()[:n]))
    elif cmd == "critical":
        print(json.dumps(pending_critical()))
    elif cmd == "all":
        print(json.dumps(pending_src()))
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
