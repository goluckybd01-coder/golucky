#!/usr/bin/env python3
"""Write batch from JSON {path: content} via mcp_immediate_write.py stdin."""
import json
import subprocess
import sys

WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    written, failures = 0, []
    for path, content in data.items():
        proc = subprocess.run(
            [sys.executable, WRITE, path],
            input=content,
            text=True,
            capture_output=True,
        )
        if proc.returncode != 0:
            failures.append({"path": path, "error": (proc.stderr or proc.stdout).strip()})
        else:
            written += 1
            print(proc.stdout.strip())
    print(json.dumps({"written": written, "failed": len(failures), "failures": failures}))


if __name__ == "__main__":
    main()
