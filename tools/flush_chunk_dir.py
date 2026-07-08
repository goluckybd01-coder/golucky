#!/usr/bin/env python3
"""Flush .export-tmp/chunk/<encoded_path> files via mcp_immediate_write.py."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
CHUNK = "/workspace/.export-tmp/chunk"
WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    mapping_path = sys.argv[1] if len(sys.argv) > 1 else None
    written = skipped = failed = 0
    failures = []

    if mapping_path and os.path.isfile(mapping_path):
        mapping = json.load(open(mapping_path, encoding="utf-8"))
        items = [(rel, os.path.join(CHUNK, enc)) for enc, rel in mapping.items()]
    else:
        items = []
        for name in sorted(os.listdir(CHUNK)):
            path = os.path.join(CHUNK, name)
            if os.path.isfile(path):
                items.append((name.replace("__", "/"), path))

    for rel, src in items:
        dst = os.path.join(WORKSPACE, rel)
        if os.path.isfile(dst):
            skipped += 1
            continue
        if not os.path.isfile(src):
            failed += 1
            failures.append({"path": rel, "error": f"missing chunk {src}"})
            continue
        content = open(src, encoding="utf-8").read()
        r = subprocess.run(["python3", WRITE, rel], input=content, text=True, capture_output=True)
        if r.returncode != 0:
            failed += 1
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
        else:
            written += 1
            print(r.stdout.strip())
            try:
                os.remove(src)
            except OSError:
                pass

    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures}, indent=2))


if __name__ == "__main__":
    main()
