#!/usr/bin/env python3
"""Match agent-tools/*.txt to paths by filename stem in content."""
import glob, json, os, sys

TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
WORKSPACE = "/workspace"

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

def match(content, paths):
    if not content or len(content) < 50:
        return None
    if content.startswith("{") and '"pagination"' in content[:800]:
        return None
    for p in paths:
        stem = os.path.splitext(os.path.basename(p))[0]
        if stem in content:
            return p
    return None

def main():
    paths = sys.argv[1:] if len(sys.argv) > 1 else json.load(sys.stdin)
    remaining = list(paths)
    results = {"written": 0, "skipped": 0, "paths": []}
    for tf in sorted(glob.glob(os.path.join(TOOLS, "*.txt")), key=os.path.getmtime, reverse=True):
        if not remaining:
            break
        with open(tf, encoding="utf-8", errors="replace") as f:
            content = f.read().strip()
        m = match(content, remaining)
        if not m:
            continue
        status = write_file(m, content)
        results[status] = results.get(status, 0) + 1
        results["paths"].append({"path": m, "status": status, "tool": os.path.basename(tf)})
        remaining.remove(m)
    results["failed"] = remaining
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
