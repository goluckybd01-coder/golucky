#!/usr/bin/env python3
"""Write one staged raw file via mcp_immediate_write + stage incoming."""
import os
import subprocess
import sys

WORKSPACE = "/workspace"
RAW = os.path.join(WORKSPACE, ".export-tmp/batch32_raw")
INCOMING = os.path.join(WORKSPACE, ".export-tmp/batch32_incoming")
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")


def enc(rel: str) -> str:
    return rel.replace("/", "__")


def main():
    if len(sys.argv) != 2:
        print("Usage: batch32_write_from_raw_one.py REL_PATH", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    raw = os.path.join(RAW, enc(rel))
    if not os.path.isfile(raw):
        print(f"ERROR missing raw: {rel}", file=sys.stderr)
        sys.exit(1)
    with open(raw, encoding="utf-8") as f:
        content = f.read()
    for d in (RAW, INCOMING):
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, enc(rel)), "w", encoding="utf-8", newline="\n") as f:
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
        print(r.stderr or r.stdout, file=sys.stderr)
        sys.exit(1)
    print(r.stdout.strip())


if __name__ == "__main__":
    main()
