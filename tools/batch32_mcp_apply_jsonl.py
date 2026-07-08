#!/usr/bin/env python3
"""Apply JSONL lines {path, content} via batch32_pipe_write (mcp_immediate_write)."""
import json
import subprocess
import sys

PIPE = "/workspace/tools/batch32_pipe_write.py"


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else None
    lines = open(src, encoding="utf-8") if src else sys.stdin
    written = failed = 0
    failures = []
    for i, line in enumerate(lines, 1):
        line = line.strip()
        if not line:
            continue
        try:
            item = json.loads(line)
            rel = item["path"]
            content = item["content"]
        except Exception as e:
            failed += 1
            failures.append({"line": i, "error": str(e)})
            continue
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
    print(json.dumps({"written": written, "failed": failed, "failures": failures}))


if __name__ == "__main__":
    main()
