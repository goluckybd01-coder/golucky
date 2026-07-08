#!/usr/bin/env python3
import json
import os
import subprocess
import sys

WRITE = "/workspace/tools/mcp_immediate_write.py"
WORKSPACE = "/workspace"


def main():
    batch_path = sys.argv[1]
    data = json.load(open(batch_path, encoding="utf-8"))
    written = 0
    failures = []
    for path, content in data.items():
        if os.path.isfile(os.path.join(WORKSPACE, path)):
            continue
        if not content or str(content).startswith("Lovable API error"):
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
            failures.append({"path": path, "error": (r.stderr or r.stdout).strip()})
    print(json.dumps({"written": written, "failed": len(failures), "failures": failures}))


if __name__ == "__main__":
    main()
