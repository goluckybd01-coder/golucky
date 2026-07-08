#!/usr/bin/env python3
"""Write stdin content to staging and workspace (skip existing)."""
import os
import sys

WORKSPACE = "/workspace"
STAGING = "/workspace/.export-tmp/staging"


def main():
    if len(sys.argv) < 2:
        print("Usage: batch2_stage_write.py <rel-path>  (stdin=content)", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    if not content or content.startswith("Lovable API error"):
        print(f"FAIL {rel}: empty or error")
        sys.exit(1)
    staged = os.path.join(STAGING, rel)
    os.makedirs(os.path.dirname(staged) or STAGING, exist_ok=True)
    with open(staged, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    full = os.path.join(WORKSPACE, rel)
    if os.path.isfile(full):
        print(f"SKIP {rel}")
        return
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    print(f"OK {rel} ({len(content)} bytes)")


if __name__ == "__main__":
    main()
