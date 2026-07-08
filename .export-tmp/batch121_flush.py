#!/usr/bin/env python3
"""Flush path->content JSON via mcp_immediate_write.py"""
import json
import subprocess
import sys

WRITE = "/workspace/tools/mcp_immediate_write.py"

def main():
    data = json.load(sys.stdin)
    written = failed = 0
    failures = []
    for path, content in data.items():
        if not content or str(content).startswith("Lovable API error"):
            failed += 1
            failures.append({"path": path, "error": "empty or API error"})
            continue
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
            print(r.stderr or r.stdout, file=sys.stderr)
    print(json.dumps({"written": written, "failed": failed, "failures": failures}))

if __name__ == "__main__":
    main()
