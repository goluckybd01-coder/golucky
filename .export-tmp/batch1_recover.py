#!/usr/bin/env python3
"""Recover batch_1 files from agent-tools MCP response cache."""
import json
import os
import glob
import re

WORKSPACE = "/workspace"
TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
BATCH_FILE = "/workspace/.export-tmp/batch_1.json"


def load_batch():
    return json.load(open(BATCH_FILE))


def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    if os.path.isfile(full):
        return False
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return True


def detect_path(content, candidates):
    if not content or len(content) < 30:
        return None
    if content.startswith("{") and '"pagination"' in content[:500]:
        return None
    if "Lovable API error" in content[:100]:
        return None

    basename_map = {}
    for p in candidates:
        base = os.path.splitext(os.path.basename(p))[0]
        basename_map.setdefault(base, []).append(p)

    patterns = [
        r"export\s+default\s+(?:function\s+)?(\w+)",
        r"export\s+(?:const|function)\s+(\w+)",
        r"export\s+default\s+(\w+)",
    ]
    for pat in patterns:
        for m in re.finditer(pat, content):
            name = m.group(1)
            hits = basename_map.get(name, [])
            if len(hits) == 1:
                return hits[0]

    for base, paths in basename_map.items():
        if len(paths) != 1:
            continue
        if re.search(rf"\b{re.escape(base)}\b", content[:4000]):
            return paths[0]

    return None


def main():
    batch = load_batch()
    pending = set(p for p in batch if not os.path.isfile(os.path.join(WORKSPACE, p)))
    recovered = []
    seen = set()

    for f in sorted(glob.glob(os.path.join(TOOLS, "*.txt")), key=os.path.getmtime, reverse=True):
        with open(f, encoding="utf-8", errors="replace") as inf:
            c = inf.read().strip()
        if not c or c in seen:
            continue
        path = detect_path(c, pending)
        if path:
            if write_file(path, c):
                recovered.append(path)
                pending.discard(path)
                seen.add(c)

    existing = sum(1 for p in batch if os.path.isfile(os.path.join(WORKSPACE, p)))
    print(
        json.dumps(
            {
                "total": len(batch),
                "recovered": len(recovered),
                "recovered_paths": recovered,
                "written": existing,
                "pending": len(batch) - existing,
            }
        )
    )


if __name__ == "__main__":
    main()
