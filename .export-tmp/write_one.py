#!/usr/bin/env python3
"""Write MCP-fetched file content from agent-tools style dump via stdin path list."""
import subprocess, sys, os
WRITE = "/workspace/tools/mcp_immediate_write.py"

def write_file(rel, path):
    content = open(path, encoding='utf-8').read()
    r = subprocess.run([sys.executable, WRITE, rel], input=content, text=True, capture_output=True)
    if r.returncode: raise RuntimeError(r.stderr or r.stdout)
    print(r.stdout.strip())

if __name__ == '__main__':
    write_file(sys.argv[1], sys.argv[2])
