#!/usr/bin/env python3
"""Write files via mcp_immediate_write.py from JSON map {rel_path: content}, always overwrite."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
WRITE = os.path.join(WORKSPACE, "tools", "mcp_immediate_write.py")


def main():
    data_path = sys.argv[1] if len(sys.argv) > 1 else "/workspace/.export-tmp/batch_content.json"
    mapping = json.load(open(data_path, encoding="utf-8"))
    written = failed = 0
    failures = []
    for rel, content in mapping.items():
        if not content:
            failed += 1
            failures.append({"path": rel, "error": "empty content"})
            continue
        r = subprocess.run(
            ["python3", WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode != 0:
            failed += 1
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
        else:
            written += 1
            print(r.stdout.strip())
    print(json.dumps({"written": written, "failed": failed, "failures": failures}, indent=2))


if __name__ == "__main__":
    main()
