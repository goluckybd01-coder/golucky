#!/usr/bin/env python3
"""Write chunk JSON (path->content) via mcp_immediate_write + stage to batch32_raw."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
RAW = os.path.join(WORKSPACE, ".export-tmp/batch32_raw")
INCOMING = os.path.join(WORKSPACE, ".export-tmp/batch32_incoming")
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")


def enc(rel: str) -> str:
    return rel.replace("/", "__")


def write_one(rel: str, content: str) -> bool:
    if not content or not str(content).strip():
        print(f"SKIP empty: {rel}", file=sys.stderr)
        return False
    os.makedirs(RAW, exist_ok=True)
    os.makedirs(INCOMING, exist_ok=True)
    for d in (RAW, INCOMING):
        fp = os.path.join(d, enc(rel))
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
    src = sys.argv[1] if len(sys.argv) > 1 else None
    data = json.load(open(src, encoding="utf-8")) if src else json.load(sys.stdin)
    written = sum(1 for rel, content in data.items() if write_one(rel, content))
    print(json.dumps({"written": written, "total": len(data)}))


if __name__ == "__main__":
    main()
