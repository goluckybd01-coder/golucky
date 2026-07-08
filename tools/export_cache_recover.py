#!/usr/bin/env python3
"""
Process pending src paths: for each missing path, check agent-tools cache by export name.
If not found, emit path for agent MCP fetch (stdout JSON lines).
If found, write immediately.
"""
import glob
import json
import os
import re
import sys

sys.path.insert(0, "/workspace/tools")
from mcp_batch_export import write_file

TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"


def pending_src(limit=9999):
    data = json.load(open(PENDING, encoding="utf-8"))
    return [p for p in data["pending_src_paths"] if not os.path.isfile(os.path.join(WORKSPACE, p))][:limit]


def load_tool_cache():
    cache = []
    seen = set()
    for tf in sorted(glob.glob(os.path.join(TOOLS, "*.txt")), key=os.path.getmtime, reverse=True):
        try:
            with open(tf, encoding="utf-8", errors="replace") as f:
                c = f.read().strip()
        except OSError:
            continue
        if len(c) < 80 or c.startswith("{"):
            continue
        h = hash(c[:5000])
        if h in seen:
            continue
        seen.add(h)
        names = set(re.findall(r"export\s+(?:default\s+)?(?:function|const)\s+(\w+)", c))
        m = re.search(r"export\s+default\s+(\w+)\s*;", c)
        if m:
            names.add(m.group(1))
        m = re.search(r"const\s+(\w+)\s*=\s*\(\)\s*=>", c)
        if m:
            names.add(m.group(1))
        cache.append((names, c, tf))
    return cache


def find_in_cache(path, cache):
    stem = os.path.splitext(os.path.basename(path))[0]
    hits = []
    for names, content, tf in cache:
        if stem in names:
            hits.append((content, tf))
        elif stem.endswith(".test") and stem.replace(".docs.test", "").replace(".test", "") in content:
            hits.append((content, tf))
    if len(hits) == 1:
        return hits[0]
    return None


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "recover"
    if cmd == "recover":
        cache = load_tool_cache()
        ok = 0
        still = []
        for path in pending_src():
            hit = find_in_cache(path, cache)
            if hit:
                content, tf = hit
                try:
                    write_file(path, content)
                    print(f"OK {path} ({len(content)} bytes) <- {os.path.basename(tf)}")
                    ok += 1
                except Exception as e:
                    print(f"FAIL {path}: {e}", file=sys.stderr)
                    still.append(path)
            else:
                still.append(path)
        print(json.dumps({"recovered": ok, "need_fetch": len(still), "pending_src": len(still)}))
    elif cmd == "need":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 25
        cache = load_tool_cache()
        need = []
        for path in pending_src(n * 4):
            if find_in_cache(path, cache):
                continue
            need.append(path)
            if len(need) >= n:
                break
        print(json.dumps(need))
    else:
        print("Usage: export_cache_recover.py [recover|need N]")
        sys.exit(1)


if __name__ == "__main__":
    main()
