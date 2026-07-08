#!/usr/bin/env python3
"""Write multiple files from a JSON map {path: content}."""
import json, os, sys
WORKSPACE = "/workspace"
data = json.load(sys.stdin)
ok = fail = 0
for path, content in data.items():
    if content is None:
        fail += 1
        continue
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    try:
        with open(full, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
            if content and not content.endswith("\n"):
                f.write("\n")
        ok += 1
    except Exception as e:
        print(f"FAIL {path}: {e}", file=sys.stderr)
        fail += 1
print(json.dumps({"ok": ok, "fail": fail}))
