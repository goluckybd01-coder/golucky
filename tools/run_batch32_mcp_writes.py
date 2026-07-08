#!/usr/bin/env python3
"""Write batch32 files via mcp_immediate_write from JSON dict on stdin or file arg."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")
INCOMING = os.path.join(WORKSPACE, ".export-tmp/batch32_incoming")
RAW = os.path.join(WORKSPACE, ".export-tmp/batch32_raw")


def enc(rel: str) -> str:
    return rel.replace("/", "__")


def write_one(rel: str, content: str) -> bool:
    if not content or not content.strip():
        print(f"SKIP empty: {rel}", file=sys.stderr)
        return False
    os.makedirs(INCOMING, exist_ok=True)
    os.makedirs(RAW, exist_ok=True)
    for fp in (os.path.join(INCOMING, enc(rel)), os.path.join(RAW, enc(rel))):
        with open(fp, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
            if not content.endswith("\n"):
                f.write("\n")
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        print(f"FAIL {rel}: {r.stderr or r.stdout}", file=sys.stderr)
        return False
    print(r.stdout.strip())
    return True


def main():
    if len(sys.argv) > 1:
        data = json.load(open(sys.argv[1], encoding="utf-8"))
    else:
        data = json.load(sys.stdin)
    written = sum(1 for rel, content in data.items() if write_one(rel, content))
    print(json.dumps({"written": written, "total": len(data)}))


if __name__ == "__main__":
    main()
