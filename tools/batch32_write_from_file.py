#!/usr/bin/env python3
"""Write one batch32 file from a content file via mcp_immediate_write + stage."""
import os
import subprocess
import sys

WORKSPACE = "/workspace"
INCOMING = os.path.join(WORKSPACE, ".export-tmp/batch32_incoming")
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")


def main():
    if len(sys.argv) != 3:
        print("Usage: batch32_write_from_file.py REL_PATH CONTENT_FILE", file=sys.stderr)
        sys.exit(1)
    rel, content_path = sys.argv[1], sys.argv[2]
    with open(content_path, encoding="utf-8") as f:
        content = f.read()
    if not content.strip():
        print(f"ERROR empty: {rel}", file=sys.stderr)
        sys.exit(1)
    os.makedirs(INCOMING, exist_ok=True)
    enc = rel.replace("/", "__")
    stage = os.path.join(INCOMING, enc)
    with open(stage, "w", encoding="utf-8", newline="\n") as f:
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
