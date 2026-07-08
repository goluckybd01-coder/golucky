#!/usr/bin/env python3
"""Write files from .export-tmp/reads/*.content to workspace."""
import glob
import os
import subprocess
import sys

WORKSPACE = "/workspace"
READS = "/workspace/.export-tmp/reads"

def main():
    written = []
    failed = []
    for cf in sorted(glob.glob(os.path.join(READS, "*.content"))):
        name = os.path.basename(cf)
        if not name.endswith(".content"):
            continue
        rel = name[:-len(".content")].replace("__", "/")
        content = open(cf, encoding="utf-8").read()
        if not content.strip():
            failed.append({"path": rel, "error": "empty"})
            continue
        try:
            p = subprocess.run(
                ["python3", "/workspace/.export-tmp/batch2_write_stdin.py", rel],
                input=content,
                capture_output=True,
                text=True,
                check=True,
            )
            written.append(rel)
            print(p.stdout.strip())
        except subprocess.CalledProcessError as e:
            failed.append({"path": rel, "error": e.stderr or str(e)})
    print({"written": len(written), "failed": failed, "paths_written": written})

if __name__ == "__main__":
    main()
