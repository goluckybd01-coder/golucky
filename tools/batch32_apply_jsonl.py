#!/usr/bin/env python3
"""Apply batch32 JSONL (path, content per line) via mcp_immediate_write."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
WRITE_FROM_FILE = os.path.join(WORKSPACE, "tools/batch32_write_from_file.py")
RAW = os.path.join(WORKSPACE, ".export-tmp/batch32_raw")


def main():
    if len(sys.argv) != 2:
        print("Usage: batch32_apply_jsonl.py JSONL_PATH", file=sys.stderr)
        sys.exit(1)
    jsonl_path = sys.argv[1]
    os.makedirs(RAW, exist_ok=True)
    written = failed = 0
    failures = []
    with open(jsonl_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            rel = obj["path"]
            content = obj["content"]
            enc = rel.replace("/", "__")
            raw = os.path.join(RAW, enc)
            with open(raw, "w", encoding="utf-8", newline="\n") as out:
                out.write(content)
                if not content.endswith("\n"):
                    out.write("\n")
            r = subprocess.run(
                [sys.executable, WRITE_FROM_FILE, rel, raw],
                capture_output=True,
                text=True,
            )
            if r.returncode == 0:
                written += 1
                print(r.stdout.strip())
            else:
                failed += 1
                failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
    print(json.dumps({"written": written, "failed": failed, "failures": failures}, indent=2))
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
