#!/usr/bin/env python3
"""Write one file from base64-encoded content. Usage: write_b64.py <path> <b64>"""
import base64, os, sys
WORKSPACE = "/workspace"
path, b64 = sys.argv[1], sys.argv[2]
content = base64.b64decode(b64).decode("utf-8")
full = os.path.join(WORKSPACE, path)
if os.path.exists(full):
    print("skipped")
    sys.exit(0)
os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
with open(full, "w", encoding="utf-8", newline="\n") as f:
    f.write(content)
    if content and not content.endswith("\n"):
        f.write("\n")
print("written")
