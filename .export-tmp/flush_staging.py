#!/usr/bin/env python3
"""Copy .export-tmp/staging/** to /workspace/** (skip existing)."""
import json
import os

STAGING = "/workspace/.export-tmp/staging"
WORKSPACE = "/workspace"

def main():
    written = skipped = 0
    for root, _, files in os.walk(STAGING):
        for fn in files:
            rel = os.path.relpath(os.path.join(root, fn), STAGING)
            src = os.path.join(root, fn)
            dst = os.path.join(WORKSPACE, rel)
            if os.path.isfile(dst):
                skipped += 1
                continue
            os.makedirs(os.path.dirname(dst) or WORKSPACE, exist_ok=True)
            with open(src, encoding="utf-8") as s:
                content = s.read()
            with open(dst, "w", encoding="utf-8", newline="\n") as d:
                d.write(content)
                if content and not content.endswith("\n"):
                    d.write("\n")
            written += 1
    print(json.dumps({"written": written, "skipped": skipped}))

if __name__ == "__main__":
    main()
