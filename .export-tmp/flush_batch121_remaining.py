#!/usr/bin/env python3
"""Flush all batch121 remaining files from embedded content dict."""
import json
import subprocess
import sys

WRITE = "/workspace/tools/mcp_immediate_write.py"

def load_files():
    return json.load(open("/workspace/.export-tmp/batch121_remaining_content.json", encoding="utf-8"))

def main():
    files = load_files()
    written = failed = 0
    failures = []
    for path, content in files.items():
        r = subprocess.run(
            ["python3", WRITE, path],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode == 0:
            written += 1
            print(r.stdout.strip())
        else:
            failed += 1
            failures.append({"path": path, "error": (r.stderr or r.stdout).strip()})
    print(json.dumps({"written": written, "failed": failed, "failures": failures}))

if __name__ == "__main__":
    main()
