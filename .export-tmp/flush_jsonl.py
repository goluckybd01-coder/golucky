#!/usr/bin/env python3
"""Write all JSONL entries via mcp_immediate_write. Usage: flush_jsonl.py <jsonl-file>"""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    if len(sys.argv) != 2:
        print("Usage: flush_jsonl.py <jsonl-file>", file=sys.stderr)
        sys.exit(1)
    jsonl = sys.argv[1]
    written = skipped = failed = 0
    failures = []
    with open(jsonl, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            item = json.loads(line)
            rel = item["path"]
            content = item.get("content", "")
            full = os.path.join(WORKSPACE, rel)
            if os.path.isfile(full):
                skipped += 1
                continue
            if not content or not str(content).strip():
                failures.append({"path": rel, "error": "empty content"})
                failed += 1
                continue
            r = subprocess.run(
                [sys.executable, WRITE, rel],
                input=content,
                text=True,
                capture_output=True,
            )
            if r.returncode:
                failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
                failed += 1
            else:
                written += 1
                print(r.stdout.strip())
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures}, indent=2))


if __name__ == "__main__":
    main()
