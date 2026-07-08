#!/usr/bin/env python3
"""Export files from Lovable MCP read responses stored as JSONL.
Each line: {"path": "...", "content": "..."}
"""
import json, os, sys

WORKSPACE = "/workspace"

def write_file(rel_path, content):
    full = os.path.join(WORKSPACE, rel_path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="") as f:
        f.write(content)

def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "/workspace/.export-tmp/batch_export.jsonl"
    ok = fail = 0
    failures = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            item = json.loads(line)
            p = item.get("path")
            c = item.get("content")
            if not p or c is None:
                fail += 1
                failures.append({"path": p, "error": item.get("error", "no content")})
                continue
            try:
                write_file(p, c)
                ok += 1
            except Exception as e:
                fail += 1
                failures.append({"path": p, "error": str(e)})
    print(json.dumps({"ok": ok, "fail": fail, "failures": failures}))

if __name__ == "__main__":
    main()
