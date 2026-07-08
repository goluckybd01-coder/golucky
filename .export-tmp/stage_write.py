#!/usr/bin/env python3
"""Write staged files: python3 stage_write.py <staging.json>"""
import json
import subprocess
import sys

WRITE = "/workspace/tools/mcp_immediate_write.py"

def main():
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    written = failed = 0
    failures = []
    for path, content in data.items():
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
