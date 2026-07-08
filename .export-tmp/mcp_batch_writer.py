#!/usr/bin/env python3
"""Write files from JSON map file or stdin. Usage: mcp_batch_writer.py [map.json]"""
import json, os, sys

WORKSPACE = "/workspace"

def write_map(data):
    ok = fail = 0
    failed_paths = []
    for path, content in data.items():
        if content is None:
            fail += 1
            failed_paths.append(path)
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
            failed_paths.append(path)
    return ok, fail, failed_paths

if __name__ == "__main__":
    if len(sys.argv) > 1:
        data = json.load(open(sys.argv[1], encoding="utf-8"))
    else:
        data = json.load(sys.stdin)
    ok, fail, failed = write_map(data)
    print(json.dumps({"ok": ok, "fail": fail, "failed": failed}))
