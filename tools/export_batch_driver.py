#!/usr/bin/env python3
"""
Agent-driven Lovable export loop helper.
Prints next N pending paths; agent fetches via CallMcpTool and writes via write_content_file.py
Usage:
  python3 export_batch_driver.py next 25   # paths to fetch
  python3 export_batch_driver.py status
  python3 export_batch_driver.py critical  # critical non-src paths
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
        ps, pc = len(pending_src()), len(pending_critical())
        print(json.dumps({"pending_src": ps, "pending_critical": pc, "done": ps < 10}))
    elif cmd == "next":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 25
        print(json.dumps(pending_src()[:n]))
    elif cmd == "critical":
        print(json.dumps(pending_critical()))
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
