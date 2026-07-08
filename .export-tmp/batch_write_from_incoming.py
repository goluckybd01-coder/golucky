#!/usr/bin/env python3
"""Write paths from mcp_incoming via mcp_immediate_write."""
import os
import subprocess
import sys

INCOMING = "/workspace/.export-tmp/mcp_incoming"
WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    written = []
    failed = []
    for rel in sys.argv[1:]:
        stage = os.path.join(INCOMING, rel.replace("/", "__"))
        if not os.path.isfile(stage):
            failed.append({"path": rel, "error": "missing incoming"})
            continue
        content = open(stage, encoding="utf-8").read()
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
    print(f"written={len(written)} failed={len(failed)}")
    if failed:
        print(failed, file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
