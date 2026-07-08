#!/usr/bin/env python3
"""Apply path->content JSON via mcp_immediate_write. Usage: apply_lovable_reads.py CHUNK.json"""
import json
import subprocess
import sys

WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    chunk = sys.argv[1]
    data = json.load(open(chunk, encoding="utf-8"))
    written = []
    failed = []
    for rel, content in data.items():
        if not content or not str(content).strip():
            failed.append({"path": rel, "error": "empty"})
            continue
        r = subprocess.run(
            [sys.executable, WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode:
            failed.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
        else:
            written.append(rel)
            print(r.stdout.strip())
    print(json.dumps({"written": written, "failed": failed}, indent=2))


if __name__ == "__main__":
    main()
