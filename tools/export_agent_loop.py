#!/usr/bin/env python3
"""
Agent-driven export: reads pending paths, agent fetches via CallMcpTool,
writes JSON chunks to .export-tmp/chunks/batch_N.json, then:
  python3 tools/export_agent_loop.py flush batch_N.json
"""
import json
import os
import sys

WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"
CHUNK_DIR = "/workspace/.export-tmp/chunks"


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


def write_file(rel, content):
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    if content and not content.endswith("\n"):
        content += "\n"
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    return "written"


def cmd_status():
    ps, pc = pending_src(), pending_critical()
    print(json.dumps({"pending_src": len(ps), "pending_critical": len(pc), "first_10": ps[:10]}))


def cmd_next(n=25):
    print(json.dumps(pending_src()[: int(n)]))


def cmd_flush(chunk_path):
    mapping = json.load(open(chunk_path, encoding="utf-8"))
    stats = {"written": 0, "failed": 0, "failures": []}
    for path, content in mapping.items():
        try:
            if not content:
                raise ValueError("empty")
            write_file(path, content)
            stats["written"] += 1
            print(f"OK {path}")
        except Exception as e:
            stats["failed"] += 1
            stats["failures"].append({"path": path, "error": str(e)})
            print(f"FAIL {path}: {e}")
    stats["pending_src"] = len(pending_src())
    print(json.dumps(stats))


def main():
    os.makedirs(CHUNK_DIR, exist_ok=True)
    if len(sys.argv) < 2:
        cmd_status()
        return
    cmd = sys.argv[1]
    if cmd == "status":
        cmd_status()
    elif cmd == "next":
        cmd_next(sys.argv[2] if len(sys.argv) > 2 else 25)
    elif cmd == "flush":
        cmd_flush(sys.argv[2])
    else:
        print("Usage: export_agent_loop.py [status|next N|flush CHUNK.json]", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
