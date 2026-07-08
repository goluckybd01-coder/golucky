#!/usr/bin/env python3
"""
Orchestrator: prints batch paths for agent MCP fetch+write cycles.
Agent must CallMcpTool read_file for each path, then:
  python3 tools/mcp_immediate_write.py PATH <<'EOF'
  ...content...
  EOF

This script tracks progress only.
"""
import json
import os
import sys

WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"
BATCH = 25


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
        ps = pending_src()
        pc = pending_critical()
        print(json.dumps({"pending_src": len(ps), "pending_critical": len(pc), "done": len(ps) < 10}))
        return
    if cmd == "next":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else BATCH
        print(json.dumps(pending_src()[:n]))
        return
    if cmd == "critical":
        print(json.dumps(pending_critical()))
        return
    print("Usage: run_mcp_export_batches.py [status|next N|critical]", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()
