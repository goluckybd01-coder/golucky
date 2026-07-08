#!/usr/bin/env python3
"""Scan agent-tools for export function names matching pending paths."""
import glob
import json
import os
import re
import sys

sys.path.insert(0, "/workspace/tools")
from mcp_batch_export import write_file

TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
PENDING = "/workspace/.export-tmp/pending_all.json"
WORKSPACE = "/workspace"


def pending():
    data = json.load(open(PENDING, encoding="utf-8"))
    return [p for p in data["pending_src_paths"] if not os.path.isfile(os.path.join(WORKSPACE, p))]


def names_from(content):
    names = set(re.findall(r"export\s+(?:default\s+)?(?:function|const)\s+(\w+)", content))
    m = re.search(r"export\s+default\s+(\w+)\s*;", content)
    if m:
        names.add(m.group(1))
    for m in re.finditer(r"export\s+(?:const|function)\s+(\w+)", content):
        names.add(m.group(1))
    return names


def stem(path):
    base = os.path.basename(path)
    for s in (".docs.test.ts", ".test.tsx", ".test.ts", ".tsx", ".ts"):
        if base.endswith(s):
            return base[: -len(s)]
    return os.path.splitext(base)[0]


def main():
    cache = []
    seen = set()
    for tf in sorted(glob.glob(os.path.join(TOOLS, "*.txt")), key=os.path.getmtime, reverse=True):
        try:
            c = open(tf, encoding="utf-8", errors="replace").read().strip()
        except OSError:
            continue
        if len(c) < 80 or c.startswith("{"):
            continue
        h = hash(c[:10000])
        if h in seen:
            continue
        seen.add(h)
        cache.append((names_from(c), c, tf))

    ok = 0
    for path in pending():
        s = stem(path)
        hits = [(c, tf) for names, c, tf in cache if s in names]
        if len(hits) != 1:
            continue
        content, tf = hits[0]
        try:
            write_file(path, content)
            print(f"OK {path} ({len(content)} bytes) <- {os.path.basename(tf)}")
            ok += 1
        except Exception as e:
            print(f"FAIL {path}: {e}", file=sys.stderr)
    remaining = len(pending())
    print(json.dumps({"written": ok, "pending_src": remaining}))


if __name__ == "__main__":
    main()
