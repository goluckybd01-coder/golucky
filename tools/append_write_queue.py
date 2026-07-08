#!/usr/bin/env python3
"""Append one file to write queue from stdin. Usage: append_write_queue.py REL_PATH < content"""
import json
import os
import sys

QUEUE = "/workspace/.export-tmp/write_queue.jsonl"

def main():
    if len(sys.argv) != 2:
        print("Usage: append_write_queue.py REL_PATH", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    os.makedirs(os.path.dirname(QUEUE), exist_ok=True)
    with open(QUEUE, "a", encoding="utf-8") as f:
        f.write(json.dumps({"path": rel, "content": content}, ensure_ascii=False) + "\n")
    print(f"QUEUED {rel} ({len(content)} bytes)")

if __name__ == "__main__":
    main()
