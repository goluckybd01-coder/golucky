#!/usr/bin/env python3
import os, sys
WORKSPACE = "/workspace"
rel = sys.argv[1]
content = sys.stdin.read()
full = os.path.join(WORKSPACE, rel)
os.makedirs(os.path.dirname(full), exist_ok=True)
with open(full, "w", encoding="utf-8", newline="\n") as f:
    f.write(content)
    if content and not content.endswith("\n"):
        f.write("\n")
print(f"OK {rel} {len(content)} bytes")
