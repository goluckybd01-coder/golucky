#!/usr/bin/env python3
"""Write staged reads from .export-tmp/reads/ mirror into workspace."""
import os
import shutil

READS = "/workspace/.export-tmp/reads"
WORKSPACE = "/workspace"

def main():
    written = 0
    for root, _, files in os.walk(READS):
        for f in files:
            src = os.path.join(root, f)
            rel = os.path.relpath(src, READS)
            dst = os.path.join(WORKSPACE, rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            with open(src, "r", encoding="utf-8") as rf:
                content = rf.read()
            with open(dst, "w", encoding="utf-8", newline="\n") as wf:
                wf.write(content)
                if content and not content.endswith("\n"):
                    wf.write("\n")
            written += 1
    print(f"Wrote {written} files")

if __name__ == "__main__":
    main()
