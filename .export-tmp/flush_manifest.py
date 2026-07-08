#!/usr/bin/env python3
"""Flush staged files via mcp_immediate_write. Manifest: {rel_path: staging_file_path}"""
import json
import subprocess
import sys

WRITE = "/workspace/tools/mcp_immediate_write.py"

def main():
    manifest = json.load(open(sys.argv[1], encoding="utf-8"))
    written = failed = 0
    failures = []
    for rel, staging in manifest.items():
        content = open(staging, encoding="utf-8").read()
        r = subprocess.run(
            ["python3", WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode == 0:
            written += 1
            print(r.stdout.strip())
        else:
            failed += 1
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
    print(json.dumps({"written": written, "failed": failed, "failures": failures}))

if __name__ == "__main__":
    main()
