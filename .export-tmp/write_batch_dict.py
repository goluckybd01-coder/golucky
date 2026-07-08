#!/usr/bin/env python3
"""Write files from JSON dict {path: content} on stdin or from file arg."""
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
    if len(sys.argv) > 1:
        data = json.load(open(sys.argv[1], encoding="utf-8"))
    else:
        data = json.load(sys.stdin)
    ok = fail = 0
    failures = []
    for path, content in data.items():
        if content is None or (isinstance(content, str) and content.startswith("Lovable API error")):
            fail += 1
            failures.append(path)
            continue
        try:
            write_file(path, content)
            ok += 1
        except Exception as e:
            fail += 1
            failures.append({"path": path, "error": str(e)})
    print(json.dumps({"ok": ok, "fail": fail, "failures": failures}))

if __name__ == "__main__":
    main()
