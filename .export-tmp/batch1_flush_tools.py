#!/usr/bin/env python3
"""Match agent-tools/*.txt to batch_1 pending paths and write immediately."""
import glob
import json
import os
import re

WORKSPACE = "/workspace"
TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
BATCH_FILE = "/workspace/.export-tmp/batch_1.json"


def load_batch():
    return json.load(open(BATCH_FILE))


def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    if os.path.isfile(full):
        return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"


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

    for pat in [
        r"export\s+default\s+(?:function\s+)?(\w+)",
        r"export\s+(?:const|function)\s+(\w+)",
        r"export\s+default\s+(\w+)",
    ]:
        for m in re.finditer(pat, content):
            hits = basename_map.get(m.group(1), [])
            if len(hits) == 1:
                return hits[0]

    for base, paths in basename_map.items():
        if len(paths) == 1 and re.search(rf"\b{re.escape(base)}\b", content[:4000]):
            return paths[0]

    return None


def main():
    batch = load_batch()
    pending = [p for p in batch if not os.path.isfile(os.path.join(WORKSPACE, p))]
    stats = {"written": 0, "skipped": 0, "failed": 0}
    seen = set()

    for tf in sorted(glob.glob(os.path.join(TOOLS, "*.txt")), key=os.path.getmtime, reverse=True):
        with open(tf, encoding="utf-8", errors="replace") as f:
            c = f.read().strip()
        if not c or c in seen:
            continue
        path = detect_path(c, pending)
        if not path:
            continue
        r = write_file(path, c)
        stats[r if r in stats else "failed"] += 1
        if r == "written":
            pending.remove(path)
        seen.add(c)

    existing = sum(1 for p in batch if os.path.isfile(os.path.join(WORKSPACE, p)))
    print(json.dumps({**stats, "total": len(batch), "written_total": existing, "pending": len(batch) - existing}))


if __name__ == "__main__":
    main()
