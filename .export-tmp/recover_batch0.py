#!/usr/bin/env python3
"""Recover batch_0 files from agent-tools MCP read_file dumps."""
import json, os, glob, re

WORKSPACE = "/workspace"
TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
BATCH = "/workspace/.export-tmp/batch_0.json"

def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    if os.path.isfile(full):
        return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "exported"

def detect_path(content, targets):
    if not content or len(content) < 40:
        return None
    if content.startswith("{") and '"pagination"' in content[:800]:
        return None
    if "Lovable API error" in content[:120]:
        return None

    # describe("Name" -> test file
    m = re.search(r'describe\(["\'](\w+)["\']', content)
    if m:
        name = m.group(1)
        cands = [p for p in targets if name in p and p.endswith(".test.tsx")]
        if len(cands) == 1:
            return cands[0]

    # export default Name
    m = re.search(r"export\s+default\s+(?:function\s+)?(\w+)", content)
    if m:
        name = m.group(1)
        cands = [p for p in targets if p.endswith(f"/{name}.tsx") or p.endswith(f"/{name}.ts") or p.endswith(f"/{name}.md")]
        if len(cands) == 1:
            return cands[0]
        if len(cands) > 1:
            # prefer shortest path (closest match)
            return sorted(cands, key=len)[0]

    # export const Name
    m = re.search(r"export\s+(?:const|function)\s+(\w+)", content)
    if m:
        name = m.group(1)
        cands = [p for p in targets if f"/{name}." in p]
        if len(cands) == 1:
            return cands[0]

    # named exports like export { GameErrorBoundary }
    m = re.search(r"export\s+\{\s*(\w+)", content)
    if m:
        name = m.group(1)
        cands = [p for p in targets if f"/{name}." in p]
        if len(cands) == 1:
            return cands[0]

    return None

def main():
    targets = json.load(open(BATCH, encoding="utf-8"))
    target_set = set(targets)
    exported = skipped = 0
    recovered = []
    unmatched = []

    for f in sorted(glob.glob(os.path.join(TOOLS, "*.txt"))):
        with open(f, encoding="utf-8", errors="replace") as inf:
            content = inf.read().strip()
        path = detect_path(content, target_set)
        if not path:
            continue
        result = write_file(path, content)
        if result == "exported":
            exported += 1
            recovered.append(path)
            target_set.discard(path)
        else:
            skipped += 1

    missing = [p for p in targets if not os.path.isfile(os.path.join(WORKSPACE, p))]
    print(json.dumps({
        "exported": exported,
        "skipped": skipped,
        "recovered": recovered,
        "missing": len(missing),
        "missing_paths": missing,
    }, indent=2))

if __name__ == "__main__":
    main()
