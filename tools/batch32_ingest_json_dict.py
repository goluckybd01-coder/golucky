#!/usr/bin/env python3
"""Ingest JSON dict {rel_path: content} via batch32_pipe_write (mcp_immediate_write)."""
import json
import subprocess
import sys

PIPE = "/workspace/tools/batch32_pipe_write.py"


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else None
    data = json.load(open(src, encoding="utf-8")) if src else json.load(sys.stdin)
    written = failed = 0
    failures = []
    for rel, content in data.items():
        if not content or not str(content).strip():
            failed += 1
            failures.append({"path": rel, "error": "empty"})
            continue
        r = subprocess.run(
            [sys.executable, PIPE, rel],
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
    print(json.dumps({"written": written, "failed": failed, "total": len(data), "failures": failures}))


if __name__ == "__main__":
    main()
