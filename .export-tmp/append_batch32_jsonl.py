#!/usr/bin/env python3
"""Append one {path, content} entry to batch32.jsonl from stdin."""
import json
import sys

OUT = "/workspace/.export-tmp/batch32.jsonl"


def main():
    if len(sys.argv) != 2:
        print("Usage: append_batch32_jsonl.py REL_PATH", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    with open(OUT, "a", encoding="utf-8") as f:
        f.write(json.dumps({"path": rel, "content": content}, ensure_ascii=False) + "\n")
    print(f"Appended {rel} ({len(content)} bytes)")


if __name__ == "__main__":
    main()
