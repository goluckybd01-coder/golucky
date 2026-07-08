#!/usr/bin/env python3
"""Write staged MCP content files via mcp_immediate_write.py"""
import json
import os
import subprocess
import sys

STAGE = "/workspace/.export-tmp/mcp_staged"
WRITER = "/workspace/tools/mcp_immediate_write.py"

def main():
    manifest = sys.argv[1] if len(sys.argv) > 1 else os.path.join(STAGE, "manifest.json")
    with open(manifest, encoding="utf-8") as f:
        items = json.load(f)
    ok = fail = 0
    failures = []
    for item in items:
        rel = item["path"]
        content = item["content"]
        if not content:
            failures.append({"path": rel, "error": "empty content"})
            fail += 1
            continue
        try:
            r = subprocess.run(
                ["python3", WRITER, rel],
                input=content,
                text=True,
                capture_output=True,
            )
            if r.returncode == 0:
                print(r.stdout.strip())
                ok += 1
            else:
                err = (r.stderr or r.stdout or "unknown").strip()
                failures.append({"path": rel, "error": err})
                fail += 1
        except Exception as e:
            failures.append({"path": rel, "error": str(e)})
            fail += 1
    print(json.dumps({"written": ok, "failed": fail, "failures": failures}))

if __name__ == "__main__":
    main()
