#!/usr/bin/env python3
"""Write file from staging: python3 write_from_staging.py <rel-path>"""
import os, sys
WORKSPACE = "/workspace"
STAGING = os.path.join(WORKSPACE, ".export-tmp", "staging")

def safe(p):
    return p.replace("/", "__")

def main():
    rel = sys.argv[1]
    src = os.path.join(STAGING, safe(rel) + ".txt")
    if not os.path.exists(src):
        print(f"MISSING {src}", file=sys.stderr)
        sys.exit(1)
    with open(src, encoding="utf-8") as f:
        content = f.read()
    dst = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(dst) or WORKSPACE, exist_ok=True)
    with open(dst, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    print(f"OK {rel} {len(content)} bytes")

if __name__ == "__main__":
    main()
