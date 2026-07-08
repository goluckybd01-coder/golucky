#!/usr/bin/env python3
"""Append one {"path","content"} line to batch32 JSONL from stdin. Usage: append_batch32_jsonl.py REL_PATH"""
import json
import sys

OUT = "/workspace/.export-tmp/batch32.jsonl"

def main():
    if len(sys.argv) != 2:
        print("Usage: append_batch32_jsonl.py REL_PATH", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    if not content.strip():
        print(f"ERROR empty: {rel}", file=sys.stderr)
        sys.exit(1)
    with open(OUT, "a", encoding="utf-8") as f:
        f.write(json.dumps({"path": rel, "content": content}, ensure_ascii=False) + "\n")
    print(f"Appended {rel} ({len(content)} bytes)")

if __name__ == "__main__":
    main()
