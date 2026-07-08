#!/usr/bin/env python3
import subprocess, sys
from pathlib import Path
rel = sys.argv[1]
src = Path(sys.argv[2])
content = src.read_text(encoding='utf-8')
r = subprocess.run([sys.executable, '/workspace/tools/mcp_immediate_write.py', rel], input=content, text=True, capture_output=True)
print(r.stdout.strip() if r.returncode == 0 else (r.stderr or r.stdout), end='')
sys.exit(r.returncode)
