#!/usr/bin/env python3
"""
Build batch JSON from .export-tmp/reads/*.content files and write to workspace.
Usage: python3 assemble_batch.py <manifest-file>
Manifest: one relative path per line.
Content files: .export-tmp/reads/{path with / -> __}.content
"""
import json
import os
import sys

WORKSPACE = "/workspace"
READS = os.path.join(WORKSPACE, ".export-tmp", "reads")
BATCHES = os.path.join(WORKSPACE, ".export-tmp", "batches")


def safe(path: str) -> str:
    return path.replace("/", "__")


def write_file(rel: str, content: str) -> None:
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")


def main():
    manifest = sys.argv[1]
    batch_name = os.path.splitext(os.path.basename(manifest))[0]
    with open(manifest) as f:
        paths = [ln.strip() for ln in f if ln.strip()]

    items = []
    exported = 0
    failures = []
    for path in paths:
        cf = os.path.join(READS, safe(path) + ".content")
        if not os.path.exists(cf):
            failures.append({"path": path, "error": "content file missing in reads/"})
            continue
        with open(cf, encoding="utf-8") as f:
            content = f.read()
        items.append({"path": path, "content": content})
        try:
            write_file(path, content)
            exported += 1
        except Exception as e:
            failures.append({"path": path, "error": str(e)})

    os.makedirs(BATCHES, exist_ok=True)
    batch_json = os.path.join(BATCHES, f"{batch_name}.json")
    with open(batch_json, "w", encoding="utf-8") as f:
        json.dump(items, f)

    print(json.dumps({"batch": batch_name, "exported": exported, "failures": failures}))


if __name__ == "__main__":
    main()
