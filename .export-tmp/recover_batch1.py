#!/usr/bin/env python3
"""Recover batch_1 pending files from agent-tools using export name matching."""
import glob
import json
import os
import re

WORKSPACE = "/workspace"
TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
BATCH = "/workspace/.export-tmp/batch_1.json"


def pending():
    batch = json.load(open(BATCH))
    return [p for p in batch if not os.path.exists(os.path.join(WORKSPACE, p))]


def detect_path(content: str, pen_set: set[str]) -> str | None:
    if not content or len(content) < 50:
        return None
    if content.startswith("{") and '"pagination"' in content[:500]:
        return None
    if "Lovable API error" in content[:100]:
        return None

    patterns = [
        r"export\s+const\s+(\w+)",
        r"export\s+default\s+function\s+(\w+)",
        r"export\s+default\s+(\w+)",
        r"const\s+(\w+)\s*=\s*\(\)\s*=>",
        r"function\s+(\w+)\s*\(",
    ]
    names = []
    for pat in patterns:
        for m in re.finditer(pat, content[:5000]):
            names.append(m.group(1))

    for name in names:
        exact = [p for p in pen_set if os.path.basename(p) == f"{name}.tsx" or os.path.basename(p) == f"{name}.ts"]
        if len(exact) == 1:
            return exact[0]
    return None


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


def main():
    pen = pending()
    pen_set = set(pen)
    written = skipped = 0
    used_tools = set()
    for tf in sorted(glob.glob(os.path.join(TOOLS, "*.txt")), key=os.path.getmtime, reverse=True):
        if not pen_set:
            break
        if tf in used_tools:
            continue
        with open(tf, encoding="utf-8", errors="replace") as f:
            content = f.read().strip()
        path = detect_path(content, pen_set)
        if not path:
            continue
        status = write_file(path, content)
        if status == "written":
            written += 1
            pen_set.remove(path)
        else:
            skipped += 1
        used_tools.add(tf)
    print(json.dumps({"written": written, "skipped": skipped, "remaining": len(pen_set)}))


if __name__ == "__main__":
    main()
