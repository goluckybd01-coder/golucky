#!/usr/bin/env python3
"""
Batch-write files from MCP read results stored as path->content in stdin JSON.
Also supports reading paths from pending list and writing empty placeholders for missing.
Usage: 
  python3 batch_write_stdin.py < batch.json
  python3 batch_write_stdin.py --from-file batch.json
"""
import json, os, sys
WORKSPACE = "/workspace"

def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")

def main():
    if len(sys.argv) > 2 and sys.argv[1] == "--from-file":
        data = json.load(open(sys.argv[2]))
    else:
        data = json.load(sys.stdin)
    if isinstance(data, list):
        items = [(d["path"], d.get("content")) for d in data]
    else:
        items = list(data.items())
    ok = fail = 0
    failures = []
    for path, content in items:
        if not path or content is None:
            fail += 1
            failures.append(path)
            continue
        try:
            write_file(path, content)
            ok += 1
        except Exception as e:
            fail += 1
            failures.append({"path": path, "error": str(e)})
    print(json.dumps({"ok": ok, "fail": fail, "failures": failures[:10]}))

if __name__ == "__main__":
    main()
