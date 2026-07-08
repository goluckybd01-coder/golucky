#!/usr/bin/env python3
"""Write workspace file from content file immediately. Usage: stage_and_write.py REL_PATH CONTENT_FILE"""
import subprocess
import sys

if len(sys.argv) != 3:
    print("Usage: stage_and_write.py REL_PATH CONTENT_FILE", file=sys.stderr)
    sys.exit(1)

rel, src = sys.argv[1], sys.argv[2]
with open(src, encoding="utf-8") as f:
    content = f.read()
proc = subprocess.run(
    ["python3", "/workspace/tools/lovable_persist_staging.py", "stage", rel],
    input=content,
    text=True,
    capture_output=True,
)
print(proc.stdout, end="")
if proc.returncode != 0:
    print(proc.stderr, file=sys.stderr)
    sys.exit(proc.returncode)
