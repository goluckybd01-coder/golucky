#!/usr/bin/env python3
"""Write files from JSON array [{path, content}] or map {path: content}."""
import json, os, sys
WORKSPACE = "/workspace"
data = json.load(open(sys.argv[1]))
items = data.items() if isinstance(data, dict) else [(d["path"], d["content"]) for d in data]
ok = fail = 0
for path, content in items:
    if not path or content is None:
        fail += 1
        continue
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    ok += 1
print(json.dumps({"ok": ok, "fail": fail}))
