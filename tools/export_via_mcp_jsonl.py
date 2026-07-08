#!/usr/bin/env python3
"""Write files from JSONL: each line {"path":"...","content":"..."} via mcp_immediate_write.py"""
import json
import subprocess
import sys

WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    written, failures = 0, []
    for i, line in enumerate(sys.stdin, 1):
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
            rel = obj["path"]
            content = obj["content"]
            proc = subprocess.run(
                [sys.executable, WRITE, rel],
                input=content,
                text=True,
                capture_output=True,
            )
            if proc.returncode != 0:
                failures.append({"path": rel, "error": (proc.stderr or proc.stdout).strip()})
            else:
                written += 1
                print(proc.stdout.strip())
        except Exception as e:
            failures.append({"line": i, "error": str(e)})
    print(json.dumps({"written": written, "failed": len(failures), "failures": failures}))


if __name__ == "__main__":
    main()
