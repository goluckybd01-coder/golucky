#!/usr/bin/env python3
"""Append path\\tbase64(content) line to chunk file."""
import base64
import sys

chunk = sys.argv[1] if len(sys.argv) > 1 else "/workspace/.export-tmp/chunk.b64"
path = sys.argv[2]
src = sys.argv[3]
content = open(src, encoding="utf-8").read()
with open(chunk, "a", encoding="utf-8") as f:
    f.write(path + "\t" + base64.b64encode(content.encode()).decode() + "\n")
print(f"APPENDED {path} ({len(content)} bytes)")
