#!/usr/bin/env python3
"""Write staged content files via mcp_immediate_write.py"""
import json
import os
import subprocess

WORKSPACE = "/workspace"
CONTENT = "/workspace/.export-tmp/batch121/content"
PATHS_FILE = "/workspace/.export-tmp/batch121_paths.json"
WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    written = failed = skipped = 0
    failures = []
    for rel in paths:
        dest = os.path.join(WORKSPACE, rel)
        if os.path.isfile(dest):
            skipped += 1
            continue
        enc = rel.replace("/", "__")
        src = os.path.join(CONTENT, enc)
        if not os.path.isfile(src):
            continue
        content = open(src, encoding="utf-8").read()
        r = subprocess.run(
            ["python3", WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode == 0:
            written += 1
            os.remove(src)
            print(r.stdout.strip())
        else:
            failed += 1
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
    remaining = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]
    print(json.dumps({
        "written": written,
        "failed": failed,
        "skipped": skipped,
        "failures": failures,
        "remaining": len(remaining),
        "total": len(paths),
    }))


if __name__ == "__main__":
    main()
