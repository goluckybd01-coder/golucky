#!/usr/bin/env python3
"""Match agent-tools MCP outputs to pending paths and write immediately."""
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


def extract_names(content: str) -> set[str]:
    names = set(re.findall(r"export\s+(?:default\s+)?(?:function|const)\s+(\w+)", content))
    m = re.search(r"export\s+default\s+(\w+)\s*;", content)
    if m:
        names.add(m.group(1))
    for m in re.finditer(r"export\s+(?:const|function)\s+(\w+)", content):
        names.add(m.group(1))
    return names


def load_tools():
    items = []
    seen = set()
    for tf in sorted(glob.glob(os.path.join(TOOLS, "*.txt")), key=os.path.getmtime, reverse=True):
        try:
            with open(tf, encoding="utf-8", errors="replace") as f:
                c = f.read().strip()
        except OSError:
            continue
        if len(c) < 80 or c.startswith("{"):
            continue
        h = hash(c[:8000])
        if h in seen:
            continue
        seen.add(h)
        items.append((extract_names(c), c, tf))
    return items


def stem(path: str) -> str:
    base = os.path.basename(path)
    for suffix in (".docs.test.ts", ".test.tsx", ".test.ts", ".tsx", ".ts"):
        if base.endswith(suffix):
            return base[: -len(suffix)]
    return os.path.splitext(base)[0]


def match_path(path: str, tools):
    s = stem(path)
    hits = []
    for names, content, tf in tools:
        if s in names:
            hits.append((content, tf))
        elif s.replace("_", "") in content and f"function {s}" in content:
            hits.append((content, tf))
    if len(hits) == 1:
        return hits[0]
    return None


def main():
    tools = load_tools()
    ok = fail = 0
    still = []
    for path in pending_src():
        hit = match_path(path, tools)
        if not hit:
            still.append(path)
            continue
        content, tf = hit
        try:
            write_file(path, content)
            print(f"OK {path} ({len(content)} bytes) <- {os.path.basename(tf)}")
            ok += 1
        except Exception as e:
            print(f"FAIL {path}: {e}", file=sys.stderr)
            fail += 1
            still.append(path)
    print(json.dumps({"written": ok, "failed": fail, "still_missing": len(still), "pending_src": len(still)}))


if __name__ == "__main__":
    main()
