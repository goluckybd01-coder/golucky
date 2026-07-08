#!/usr/bin/env python3
import json, os, subprocess, sys
WRITE = "/workspace/tools/mcp_immediate_write.py"
WORKSPACE = "/workspace"
paths_file = "/workspace/.export-tmp/slice_81_120_paths.json"
content_file = sys.argv[1] if len(sys.argv) > 1 else "/workspace/.export-tmp/slice_81_120_content.json"
paths = json.load(open(paths_file))
contents = json.load(open(content_file)) if os.path.isfile(content_file) else {}
written, failures = 0, []
for path in paths:
    full = os.path.join(WORKSPACE, path)
    if os.path.isfile(full):
        continue
    content = contents.get(path)
    if not content:
        failures.append({"path": path, "error": "no content staged"})
        continue
    proc = subprocess.run([sys.executable, WRITE, path], input=content, text=True, capture_output=True)
    if proc.returncode:
        failures.append({"path": path, "error": (proc.stderr or proc.stdout).strip()})
    else:
        written += 1
        print(proc.stdout.strip())
print(json.dumps({"written": written, "failed": len(failures), "failures": failures}))
