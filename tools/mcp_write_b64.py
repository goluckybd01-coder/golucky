#!/usr/bin/env python3
import base64, subprocess, sys
path, b64 = sys.argv[1], sys.argv[2]
content = base64.b64decode(b64).decode("utf-8")
proc = subprocess.run([sys.executable, "/workspace/tools/mcp_immediate_write.py", path], input=content, text=True, capture_output=True)
if proc.returncode:
    print(proc.stderr or proc.stdout, file=sys.stderr)
    sys.exit(proc.returncode)
print(proc.stdout.strip())
