#!/usr/bin/env python3
"""Write files from JSON list [{path, content}] via mcp_immediate_write.py"""
import json
import subprocess
import sys

WRITE = "/workspace/tools/mcp_immediate_write.py"

def main():
    path = sys.argv[1] if len(sys.argv) > 1 else None
    if path:
        items = json.load(open(path, encoding="utf-8"))
    else:
        items = json.load(sys.stdin)
    ok = fail = 0
    failures = []
    for item in items:
        rel = item["path"]
        content = item.get("content", "")
        try:
            r = subprocess.run(
                ["python3", WRITE, rel],
                input=content,
                text=True,
                capture_output=True,
            )
            if r.returncode != 0:
                raise RuntimeError((r.stderr or r.stdout).strip())
            print(r.stdout.strip())
            ok += 1
        except Exception as e:
            fail += 1
            failures.append({"path": rel, "error": str(e)})
            print(f"FAIL {rel}: {e}", file=sys.stderr)
    print(json.dumps({"written": ok, "failed": fail, "failures": failures}))

if __name__ == "__main__":
    main()
