#!/usr/bin/env python3
"""Apply batch32 tmp files: batch32_apply_tmp.py REL_PATH < content or REL_PATH TMP_FILE"""
import os
import subprocess
import sys

WORKSPACE = "/workspace"
TMP = os.path.join(WORKSPACE, ".export-tmp/batch32_tmp")
STAGE_WRITE = os.path.join(WORKSPACE, "tools/batch32_stage_and_write.py")


def apply_one(rel: str, content: str) -> tuple[bool, str]:
    r = subprocess.run(
        [sys.executable, STAGE_WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        return False, (r.stderr or r.stdout).strip()
    return True, r.stdout.strip()


def main():
    if len(sys.argv) == 2:
        rel = sys.argv[1]
        content = sys.stdin.read()
    elif len(sys.argv) == 3:
        rel = sys.argv[1]
        with open(sys.argv[2], encoding="utf-8") as f:
            content = f.read()
    else:
        print("Usage: batch32_apply_tmp.py REL_PATH [TMP_FILE]", file=sys.stderr)
        sys.exit(1)
    if not content.strip():
        print(f"ERROR empty: {rel}", file=sys.stderr)
        sys.exit(1)
    ok, msg = apply_one(rel, content)
    if not ok:
        print(msg, file=sys.stderr)
        sys.exit(1)
    print(msg)


if __name__ == "__main__":
    main()
