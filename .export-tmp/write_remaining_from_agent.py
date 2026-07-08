#!/usr/bin/env python3
"""Write remaining batch2 files - content passed as JSON on stdin: {path: content}"""
import json
import os
import sys

WORKSPACE = "/workspace"

def main():
    data = json.load(sys.stdin)
    written = []
    failed = []
    for rel, content in data.items():
        try:
            full = os.path.join(WORKSPACE, rel)
            os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
            with open(full, "w", encoding="utf-8", newline="\n") as f:
                f.write(content)
                if content and not content.endswith("\n"):
                    f.write("\n")
            written.append(rel)
            print(f"OK {rel} ({len(content)} bytes)")
        except Exception as e:
            failed.append({"path": rel, "error": str(e)})
    print(json.dumps({"written": len(written), "failed": failed, "paths_written": written}))

if __name__ == "__main__":
    main()
