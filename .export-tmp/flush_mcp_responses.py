#!/usr/bin/env python3
"""Flush .export-tmp/mcp_responses/* to /workspace paths (skip existing)."""
import glob
import json
import os

WORKSPACE = "/workspace"
RESP = "/workspace/.export-tmp/mcp_responses"
BATCH_FILE = "/workspace/.export-tmp/batch_2.json"


def name_to_path(name):
    return name.replace("__", "/")


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


def main():
    batch = set(json.load(open(BATCH_FILE, encoding="utf-8")))
    written = skipped = 0
    matched = []
    os.makedirs(RESP, exist_ok=True)
    for src in sorted(glob.glob(os.path.join(RESP, "*"))):
        if not os.path.isfile(src):
            continue
        rel = name_to_path(os.path.basename(src))
        if rel not in batch:
            continue
        with open(src, encoding="utf-8") as f:
            content = f.read()
        status = write_file(rel, content)
        if status == "written":
            written += 1
            os.remove(src)
        else:
            skipped += 1
        matched.append({"path": rel, "status": status})
    pending = sum(1 for p in batch if not os.path.isfile(os.path.join(WORKSPACE, p)))
    print(json.dumps({"written": written, "skipped": skipped, "failed": 0, "matched": matched, "pending": pending, "total": len(batch)}))


if __name__ == "__main__":
    main()
