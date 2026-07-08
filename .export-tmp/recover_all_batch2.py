#!/usr/bin/env python3
"""Match hook/lib files in agent-tools by export name and write to workspace."""
import glob
import json
import os
import re

WORKSPACE = "/workspace"
TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
BATCH_FILE = "/workspace/.export-tmp/batch_2.json"


def load_batch():
    return json.load(open(BATCH_FILE))


def basename(path):
    return os.path.splitext(os.path.basename(path))[0]


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


def extract_export_names(content):
    names = set()
    for pat in (
        r"export\s+(?:const|function)\s+(\w+)",
        r"export\s+default\s+(?:function\s+)?(\w+)",
        r"export\s+default\s+(\w+)",
    ):
        names.update(re.findall(pat, content))
    return names


def match_path(content, paths):
    if not content or len(content) < 50:
        return None
    if content.startswith("{") and '"pagination"' in content[:500]:
        return None
    if "Lovable API error" in content[:100]:
        return None

    basename_map = {}
    for p in paths:
        base = basename(p)
        basename_map.setdefault(base, []).append(p)

    for name in extract_export_names(content):
        hits = basename_map.get(name, [])
        if len(hits) == 1:
            return hits[0]

    for base, hits in basename_map.items():
        if len(hits) == 1 and re.search(rf"\b{re.escape(base)}\b", content[:12000]):
            return hits[0]

    return None


def main():
    batch = load_batch()
    pending = [p for p in batch if not os.path.isfile(os.path.join(WORKSPACE, p))]
    remaining = list(pending)
    results = {"written": 0, "skipped": 0, "matched": []}
    seen = set()

    for tf in sorted(glob.glob(os.path.join(TOOLS, "*.txt")), key=os.path.getmtime, reverse=True):
        if not remaining:
            break
        with open(tf, encoding="utf-8", errors="replace") as f:
            content = f.read().strip()
        if not content or content in seen:
            continue
        seen.add(content)
        matched = match_path(content, remaining)
        if not matched:
            continue
        status = write_file(matched, content)
        if status == "written":
            results["written"] += 1
        else:
            results["skipped"] += 1
        results["matched"].append({"path": matched, "status": status})
        remaining.remove(matched)

    results["pending"] = len(remaining)
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
