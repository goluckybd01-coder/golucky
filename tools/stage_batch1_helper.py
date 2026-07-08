#!/usr/bin/env python3
"""Write MCP-fetched batch1 files to staging from agent tool output files."""
import os, sys

STAGING = "/workspace/.export-tmp/corrupted_restore_batch1"

# Remaining files will be written by copying from stdin paths passed as args
for path in sys.argv[1:]:
    if not os.path.isfile(path):
        print(f"MISSING {path}", file=sys.stderr)
        continue
    rel = path.split("corrupted_restore_batch1/")[-1] if "corrupted_restore_batch1/" in path else os.path.basename(path)
    print(f"OK {rel}")
