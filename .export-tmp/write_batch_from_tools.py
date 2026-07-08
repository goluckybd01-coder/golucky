#!/usr/bin/env python3
"""Write batch paths by matching newest agent-tools/*.txt files."""
import json, os, glob, re, sys

WORKSPACE = "/workspace"
TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"

def basename(path):
    return os.path.splitext(os.path.basename(path))[0]

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

def match_content_to_path(content, paths):
    if not content or content.startswith("Lovable API error") or len(content) < 50:
        return None
    if content.startswith("{") and '"pagination"' in content[:500]:
        return None
    names = set()
    for m in re.finditer(r'export\s+default\s+(?:function\s+)?(\w+)', content):
        names.add(m.group(1))
    for m in re.finditer(r'export\s+(?:const|function)\s+(\w+)', content):
        names.add(m.group(1))
    for p in paths:
        if basename(p) in names:
            return p
    return None

def main():
    paths = sys.argv[1:]
    if not paths:
        print(json.dumps({"error": "no paths"}))
        sys.exit(1)

    remaining = list(paths)
    results = {"written": 0, "skipped": 0, "failed": []}
    tool_files = sorted(glob.glob(os.path.join(TOOLS, "*.txt")), key=os.path.getmtime, reverse=True)

    for tf in tool_files:
        if not remaining:
            break
        with open(tf, encoding="utf-8", errors="replace") as f:
            content = f.read().strip()
        matched = match_content_to_path(content, remaining)
        if not matched:
            continue
        status = write_file(matched, content)
        results[status] += 1
        remaining.remove(matched)
        results.setdefault("paths", []).append({"path": matched, "status": status})

    results["failed"] = remaining
    results["pending_count"] = len(remaining)
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
