#!/usr/bin/env python3
"""Save one file: batch2_save_one.py REL_PATH CONTENT_FILE"""
import os
import sys

WORKSPACE = "/workspace"


def main():
    if len(sys.argv) != 3:
        print("usage: batch2_save_one.py REL_PATH CONTENT_FILE", file=sys.stderr)
        sys.exit(1)
    rel, content_file = sys.argv[1], sys.argv[2]
    full = os.path.join(WORKSPACE, rel)
    if os.path.isfile(full):
        print(f"skipped {rel}")
        return
    with open(content_file, encoding="utf-8") as f:
        content = f.read()
    if not content or content.startswith("Lovable API error"):
        print(f"failed {rel}: empty or error content", file=sys.stderr)
        sys.exit(1)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    print(f"written {rel} ({len(content)} bytes)")


if __name__ == "__main__":
    main()
