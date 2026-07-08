#!/usr/bin/env python3
"""Write files from JSON array [{path, content}] on stdin."""
import json, os, sys

WORKSPACE = "/workspace"
items = json.load(sys.stdin)
written = 0
failed = []
for item in items:
    path = item.get("path")
    content = item.get("content")
    if not path or content is None:
        failed.append({"path": path, "error": item.get("error", "missing")})
        continue
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    written += 1
print(json.dumps({"written": written, "failed": failed}))
