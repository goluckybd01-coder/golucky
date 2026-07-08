#!/usr/bin/env python3
"""Write batch of files from JSONL: each line {"path":"...","content":"..."}"""
import json, os, sys
WORKSPACE = "/workspace"
ok = fail = 0
failures = []
for line in sys.stdin:
    line = line.strip()
    if not line: continue
    item = json.loads(line)
    path = item.get('path')
    content = item.get('content')
    if not path or content is None:
        fail += 1
        failures.append({'path': path, 'error': item.get('error', 'no content')})
        continue
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    try:
        with open(full, 'w', encoding='utf-8', newline='\n') as f:
            f.write(content)
            if content and not content.endswith('\n'):
                f.write('\n')
        ok += 1
    except Exception as e:
        fail += 1
        failures.append({'path': path, 'error': str(e)})
print(json.dumps({'ok': ok, 'fail': fail, 'failures': failures}))
