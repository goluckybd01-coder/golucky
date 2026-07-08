#!/usr/bin/env python3
"""Bulk-write agent-tools/*.txt to workspace using explicit path hints from content."""
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


def pending_set():
    data = json.load(open(PENDING, encoding="utf-8"))
    return {p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))}


def is_valid(content: str) -> bool:
    if not content or len(content) < 80:
        return False
    if content.startswith("{") and ('"data"' in content[:400] or "pagination" in content[:400]):
        return False
    if "Lovable API error" in content[:120]:
        return False
    head = content.lstrip()[:20]
    if head.startswith("@import") or head.startswith("@tailwind"):
        return False
    return True


def candidates(content: str, pending: set[str]) -> list[str]:
    hits = []
    names = set()
    for m in re.finditer(r"export\s+(?:default\s+)?(?:function|const)\s+(\w+)", content):
        names.add(m.group(1))
    m = re.search(r"export\s+default\s+(\w+)\s*;", content)
    if m:
        names.add(m.group(1))
    for name in names:
        for p in pending:
            base = os.path.splitext(os.path.basename(p))[0]
            if base == name:
                hits.append(p)
    # pages default export
    m = re.search(r"const\s+(\w+)\s*=\s*\(\)\s*=>", content)
    if m:
        name = m.group(1)
        for p in pending:
            if p.endswith(f"/{name}.tsx"):
                hits.append(p)
    return list(dict.fromkeys(hits))


def main():
    pending = pending_set()
    ok = fail = 0
    seen = set()
    for tf in sorted(glob.glob(os.path.join(TOOLS, "*.txt")), key=os.path.getmtime, reverse=True):
        with open(tf, encoding="utf-8", errors="replace") as f:
            content = f.read().strip()
        if not is_valid(content):
            continue
        h = hash(content[:8000])
        if h in seen:
            continue
        seen.add(h)
        cands = candidates(content, pending)
        if len(cands) != 1:
            continue
        path = cands[0]
        try:
            write_file(path, content)
            pending.discard(path)
            print(f"OK {path} ({len(content)} bytes) <- {os.path.basename(tf)}")
            ok += 1
        except Exception as e:
            print(f"FAIL {path}: {e}", file=sys.stderr)
            fail += 1
    ps = len(pending)
    print(json.dumps({"written": ok, "failed": fail, "pending_src": ps}))


if __name__ == "__main__":
    main()
