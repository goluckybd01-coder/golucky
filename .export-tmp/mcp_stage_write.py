#!/usr/bin/env python3
"""Write stdin to staging + mcp_immediate_write. Usage: mcp_stage_write.py REL_PATH"""
import os, subprocess, sys
WORKSPACE = "/workspace"
FETCH = "/workspace/.export-tmp/fetch_batch40"
WRITE = "/workspace/tools/mcp_immediate_write.py"
rel = sys.argv[1]
content = sys.stdin.read()
os.makedirs(FETCH, exist_ok=True)
open(os.path.join(FETCH, rel.replace("/", "__")), "w", encoding="utf-8").write(content)
r = subprocess.run([sys.executable, WRITE, rel], input=content, text=True, capture_output=True)
print(r.stdout.strip() if r.returncode == 0 else (r.stderr or r.stdout), end="")
sys.exit(r.returncode)
