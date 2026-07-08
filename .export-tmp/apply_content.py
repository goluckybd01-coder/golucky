#!/usr/bin/env python3
"""Stage + write one file. Usage: apply_content.py REL_PATH CONTENT_FILE"""
import subprocess
import sys
from pathlib import Path

STAGING = Path("/workspace/.export-tmp/staging_batch40")
WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    if len(sys.argv) != 3:
        print("Usage: apply_content.py REL_PATH CONTENT_FILE", file=sys.stderr)
        sys.exit(1)
    rel, content_file = sys.argv[1], sys.argv[2]
    content = Path(content_file).read_text(encoding="utf-8")
    if not content.strip():
        print(f"ERROR empty: {rel}", file=sys.stderr)
        sys.exit(1)
    stage = STAGING / rel.replace("/", "__")
    stage.parent.mkdir(parents=True, exist_ok=True)
    stage.write_text(content, encoding="utf-8")
    r = subprocess.run(
        ["python3", WRITE, rel],
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
