#!/usr/bin/env python3
"""Match agent-tools MCP responses to batch_1 paths and write to workspace."""
import json, os, glob, re

WORKSPACE = "/workspace"
TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
BATCH_FILE = "/workspace/.export-tmp/batch_1.json"

def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    if os.path.exists(full):
        return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"

def basename(path):
    return os.path.splitext(os.path.basename(path))[0]

def match_path(content, batch_paths, used):
    if not content or len(content) < 50:
        return None
    if content.startswith("Lovable API error"):
        return None
    if content.startswith("{") and '"pagination"' in content[:500]:
        return None

    candidates = []

    # export default Name
    for m in re.finditer(r'export\s+default\s+(?:function\s+)?(\w+)', content):
        name = m.group(1)
        for p in batch_paths:
            if p in used:
                continue
            if basename(p) == name:
                candidates.append(p)

    # export const Name
    for m in re.finditer(r'export\s+(?:const|function)\s+(\w+)', content):
        name = m.group(1)
        for p in batch_paths:
            if p in used:
                continue
            if basename(p) == name:
                candidates.append(p)

    # unique filename mention in first 500 chars
    for p in batch_paths:
        if p in used:
            continue
        b = basename(p)
        if re.search(rf'\b{re.escape(b)}\b', content[:800]):
            candidates.append(p)

    if not candidates:
        return None
    # prefer exact basename match
    for c in candidates:
        if basename(c) in content[:400]:
            return c
    return candidates[0]

def main():
    batch = json.load(open(BATCH_FILE))
    batch_set = set(batch)
    used = set()
    stats = {"written": 0, "skipped": 0, "unmatched_tools": 0, "pending": 0}

    tool_files = sorted(glob.glob(os.path.join(TOOLS, "*.txt")), key=os.path.getmtime, reverse=True)
    for tf in tool_files:
        with open(tf, encoding="utf-8", errors="replace") as f:
            content = f.read().strip()
        path = match_path(content, batch, used)
        if not path:
            stats["unmatched_tools"] += 1
            continue
        result = write_file(path, content)
        used.add(path)
        stats[result] += 1

    pending = [p for p in batch if not os.path.exists(os.path.join(WORKSPACE, p))]
    stats["pending"] = len(pending)
    stats["matched"] = len(used)
    stats["total"] = len(batch)
    print(json.dumps(stats, indent=2))
    if pending:
        print("PENDING:", json.dumps(pending[:20]))

if __name__ == "__main__":
    main()
