#!/usr/bin/env python3
"""Write batch32 files from JSON on stdin: {"rel/path": "content", ...} via batch32_pipe_write."""
import json
import subprocess
import sys

PIPE = "/workspace/tools/batch32_pipe_write.py"


def main():
    data = json.load(sys.stdin)
    written = failed = 0
    for rel, content in data.items():
        if not content or not str(content).strip():
            print(f"SKIP empty: {rel}", file=sys.stderr)
            failed += 1
            continue
        r = subprocess.run(
            [sys.executable, PIPE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode != 0:
            print(f"FAIL {rel}: {r.stderr or r.stdout}", file=sys.stderr)
            failed += 1
        else:
            written += 1
            print(r.stdout.strip())
    print(json.dumps({"written": written, "failed": failed, "total": len(data)}))


if __name__ == "__main__":
    main()
