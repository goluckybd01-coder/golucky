#!/usr/bin/env python3
"""Map agent-tools MCP responses to batch paths and write to workspace."""
import glob
import json
import os
import re
import sys

TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
WORKSPACE = "/workspace"
BATCH = "/workspace/.export-tmp/batch_1.json"

PATTERNS = [
    re.compile(r"export\s+const\s+(\w+)"),
    re.compile(r"export\s+default\s+function\s+(\w+)"),
    re.compile(r"export\s+function\s+(\w+)"),
    re.compile(r"const\s+(\w+)\s*=\s*\("),
    re.compile(r"function\s+(\w+)\s*\("),
]


def stems_from_content(content: str) -> set[str]:
    found = set()
    for pat in PATTERNS:
        for m in pat.finditer(content[:8000]):
            found.add(m.group(1))
    return found


def write_file(path: str, content: str) -> str:
    full = os.path.join(WORKSPACE, path)
    if os.path.exists(full):
        return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"


def main():
    batch = json.load(open(BATCH))
    pending = [p for p in batch if not os.path.exists(os.path.join(WORKSPACE, p))]
    stem_to_path = {os.path.splitext(os.path.basename(p))[0]: p for p in pending}

    written = skipped = matched = 0
    results = []

    for tf in sorted(glob.glob(os.path.join(TOOLS, "*.txt")), key=os.path.getmtime, reverse=True):
        with open(tf, encoding="utf-8", errors="replace") as f:
            content = f.read().strip()
        if not content or len(content) < 50:
            continue
        if content.startswith("{") and '"pagination"' in content[:800]:
            continue

        stems = stems_from_content(content)
        target = None
        for stem in stems:
            if stem in stem_to_path:
                target = stem_to_path[stem]
                break
        if not target:
            continue

        status = write_file(target, content)
        matched += 1
        if status == "written":
            written += 1
            del stem_to_path[os.path.splitext(os.path.basename(target))[0]]
        else:
            skipped += 1
        results.append({"path": target, "status": status, "tool": os.path.basename(tf)})

    remaining = list(stem_to_path.values())
    print(json.dumps({
        "written": written,
        "skipped": skipped,
        "matched": matched,
        "remaining": len(remaining),
        "paths": results,
        "failed": remaining[:20],
    }, indent=2))


if __name__ == "__main__":
    main()
