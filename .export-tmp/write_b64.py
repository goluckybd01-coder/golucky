#!/usr/bin/env python3
"""Write file from base64-encoded content. Usage: write_b64.py <path> <b64file>"""
import base64, os, sys
path, b64file = sys.argv[1], sys.argv[2]
content = base64.b64decode(open(b64file, 'rb').read())
full = os.path.join('/workspace', path)
os.makedirs(os.path.dirname(full) or '/workspace', exist_ok=True)
with open(full, 'wb') as f:
    f.write(content)
print(f'OK {path} ({len(content)} bytes)')
