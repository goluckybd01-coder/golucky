#!/usr/bin/env python3
"""Append one {path, content} entry to JSONL from stdin. Usage: append_jsonl.py <rel-path> <jsonl-file>"""
import json
import sys

def main():
    if len(sys.argv) != 3:
        print("Usage: append_jsonl.py <rel-path> <jsonl-file>", file=sys.stderr)
        sys.exit(1)
    rel, out = sys.argv[1], sys.argv[2]
    content = sys.stdin.read()
    with open(out, "a", encoding="utf-8") as f:
        f.write(json.dumps({"path": rel, "content": content}, ensure_ascii=False) + "\n")

if __name__ == "__main__":
    main()
