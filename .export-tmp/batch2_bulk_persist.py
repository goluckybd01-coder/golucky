#!/usr/bin/env python3
"""Bulk persist: read JSONL of {path, content} and write to /workspace."""
import json
import os
import sys

WORKSPACE = "/workspace"

def write_file(rel, content):
    full = os.path.join(WORKSPACE, rel)
    if os.path.isfile(full):
        return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"

def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "/workspace/.export-tmp/batch2_chunk.jsonl"
    written = skipped = failed = 0
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                rel = obj["path"]
                content = obj.get("content", "")
                if not content:
                    failed += 1
                    continue
                r = write_file(rel, content)
                if r == "written":
                    written += 1
                else:
                    skipped += 1
            except Exception as e:
                failed += 1
                print(f"ERR: {e}", file=sys.stderr)
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed}))

if __name__ == "__main__":
    main()
