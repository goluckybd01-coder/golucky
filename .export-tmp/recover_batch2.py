#!/usr/bin/env python3
"""Recover batch_2 files from agent-tools MCP outputs and staging dir."""
import json, os, glob, re

WORKSPACE = "/workspace"
TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
STAGING = "/workspace/.export-tmp/staging"
BATCH_FILE = "/workspace/.export-tmp/batch_2.json"

def load_batch():
    return json.load(open(BATCH_FILE))

def write_file(path, content):
    if os.path.isfile(os.path.join(WORKSPACE, path)):
        return False
    full = os.path.join(WORKSPACE, path)
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
        r"export\s+(?:const|function)\s+(\w+)",
        r"export\s+default\s+(?:function\s+)?(\w+)",
        r"export\s+default\s+(\w+)",
    ]
    for pat in patterns:
        m = re.search(pat, content)
        if m:
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

def recover_from_staging(pending):
    recovered = []
    if not os.path.isdir(STAGING):
        return recovered
    for p in list(pending):
        staged = os.path.join(STAGING, os.path.basename(p))
        if os.path.isfile(staged):
            with open(staged, encoding="utf-8") as f:
                content = f.read()
            if write_file(p, content):
                recovered.append(p)
                pending.discard(p)
    return recovered

def main():
    batch = load_batch()
    pending = set(p for p in batch if not os.path.isfile(os.path.join(WORKSPACE, p)))
    recovered = recover_from_staging(pending)

    seen_content = set()
    for f in sorted(glob.glob(os.path.join(TOOLS, "*.txt"))):
        with open(f, encoding="utf-8", errors="replace") as inf:
            c = inf.read().strip()
        if not c or c in seen_content:
            continue
        path = detect_path(c, pending)
        if path:
            if write_file(path, c):
                recovered.append(path)
                pending.discard(path)
                seen_content.add(c)

    print(json.dumps({
        "total": len(batch),
        "recovered": len(recovered),
        "recovered_paths": recovered,
        "pending": len(pending),
        "pending_paths": sorted(pending)[:20],
    }))

if __name__ == "__main__":
    main()
