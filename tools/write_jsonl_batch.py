#!/usr/bin/env python3
"""Write files from JSONL batch via mcp_immediate_write.py.
Each line: {"path": "...", "content": "..."}
"""
import json
import subprocess
import sys

WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "/workspace/.export-tmp/batch_write.jsonl"
    written = failed = 0
    failures = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            rel = obj["path"]
            content = obj["content"]
            r = subprocess.run(
                [sys.executable, WRITE, rel],
                input=content,
                text=True,
                capture_output=True,
            )
            if r.returncode:
                failed += 1
                failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
            else:
                written += 1
                print(r.stdout.strip())
    print(json.dumps({"written": written, "failed": failed, "failures": failures}, indent=2))


if __name__ == "__main__":
    main()
