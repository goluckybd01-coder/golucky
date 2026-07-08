#!/usr/bin/env python3
"""
Persist Lovable MCP read_file results to workspace.
Agent workflow:
  1. CallMcpTool read_file for batch of paths
  2. Append each to chunk: append_to_chunk.py CHUNK.json PATH <<'EOF'
  3. flush: python3 tools/lovable_persist_batch.py flush CHUNK.json

Or write single file from stdin:
  python3 tools/lovable_persist_batch.py write PATH <<'EOF'
"""
import json
import os
import sys

WORKSPACE = "/workspace"


def write_file(rel: str, content: str, force: bool = False) -> str:
    if not content or content.startswith("Lovable API error"):
        raise ValueError("invalid content")
    head = content.lstrip()[:20]
    if rel.endswith(".tsx") and (head.startswith("@import") or head.startswith("@tailwind")):
        raise ValueError("corrupted tsx")
    full = os.path.join(WORKSPACE, rel)
    if os.path.isfile(full) and not force:
        return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")
    return "written"


def cmd_write():
    rel = sys.argv[2]
    content = sys.stdin.read()
    status = write_file(rel, content)
    print(json.dumps({"path": rel, "status": status, "bytes": len(content)}))


def cmd_flush():
    chunk = sys.argv[2]
    data = json.load(open(chunk, encoding="utf-8"))
    stats = {"written": 0, "skipped": 0, "failed": 0, "failures": []}
    for path, content in data.items():
        try:
            r = write_file(path, content)
            if r == "written":
                stats["written"] += 1
            else:
                stats["skipped"] += 1
        except Exception as e:
            stats["failed"] += 1
            stats["failures"].append({"path": path, "error": str(e)})
    pending = json.load(open("/workspace/.export-tmp/pending_all.json", encoding="utf-8"))
    stats["pending_src"] = len(
        [p for p in pending.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))]
    )
    print(json.dumps(stats, indent=2))


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == "write":
        cmd_write()
    elif cmd == "flush":
        cmd_flush()
    else:
        print("Usage: lovable_persist_batch.py [write PATH|flush CHUNK.json]")
        sys.exit(1)


if __name__ == "__main__":
    main()
