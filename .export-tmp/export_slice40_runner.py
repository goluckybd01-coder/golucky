#!/usr/bin/env python3
"""Read JSONL {path, content} entries and write via mcp_immediate_write."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
WRITE = "/workspace/tools/mcp_immediate_write.py"
JSONL = "/workspace/.export-tmp/slice40_jsonl/batch.jsonl"


def main():
    if not os.path.isfile(JSONL):
        print(json.dumps({"written": 0, "failed": 0, "failures": [{"path": "*", "error": "no jsonl"}]}))
        return
    written = skipped = failed = 0
    failures = []
    with open(JSONL, encoding="utf-8") as f:
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
    still = []
    batch = json.load(open("/workspace/.export-tmp/batch_40_80.json"))
    still = [p for p in batch if not os.path.isfile(os.path.join(WORKSPACE, p))]
    print(json.dumps({
        "written": written,
        "skipped": skipped,
        "failed": failed,
        "failures": failures,
        "still_missing_count": len(still),
        "still_missing": still,
    }, indent=2))


if __name__ == "__main__":
    main()
