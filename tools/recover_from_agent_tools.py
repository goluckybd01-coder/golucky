#!/usr/bin/env python3
"""Match agent-tools/*.txt to pending src paths and write."""
import json
import os
import glob
import re

WORKSPACE = "/workspace"
TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
PENDING = "/workspace/.export-tmp/pending_all.json"


def pending_src():
    data = json.load(open(PENDING, encoding="utf-8"))
    return [p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))]


def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")


def guess_path(content, pending_set):
    if not content or len(content) < 80:
        return None
    if content.startswith("{") and ("pagination" in content[:400] or '"data"' in content[:300]):
        return None
    if "Lovable API error" in content[:120]:
        return None
    if content.lstrip().startswith("@import") or content.lstrip().startswith("@tailwind"):
        return None

    # basename match from export default
    m = re.search(r"export\s+default\s+(?:function\s+)?(\w+)", content)
    if m:
        name = m.group(1)
        cands = [p for p in pending_set if p.endswith(f"/{name}.tsx") or p.endswith(f"/{name}.ts")]
        if len(cands) == 1:
            return cands[0]
        if len(cands) > 1:
            return sorted(cands, key=len)[0]

    m = re.search(r"export\s+(?:const|function)\s+(\w+)", content)
    if m:
        name = m.group(1)
        cands = [p for p in pending_set if f"/{name}.tsx" in p or f"/{name}.ts" in p or p.endswith(f"/{name}.tsx")]
        if len(cands) == 1:
            return cands[0]

    # describe test files
    m = re.search(r'describe\(["\'](\w+)', content)
    if m:
        name = m.group(1)
        cands = [p for p in pending_set if name in p and p.endswith(".test.tsx")]
        if len(cands) == 1:
            return cands[0]

    return None


def main():
    pen = set(pending_src())
    recovered = []
    seen_content = set()
    for f in sorted(glob.glob(os.path.join(TOOLS, "*.txt"))):
        with open(f, encoding="utf-8", errors="replace") as inf:
            c = inf.read().strip()
        h = hash(c[:5000])
        if h in seen_content:
            continue
        seen_content.add(h)
        path = guess_path(c, pen)
        if path:
            write_file(path, c)
            pen.discard(path)
            recovered.append(path)
            print(f"OK {path} <- {os.path.basename(f)}")
    print(json.dumps({"recovered": len(recovered), "pending_src": len(pen)}))


if __name__ == "__main__":
    main()
