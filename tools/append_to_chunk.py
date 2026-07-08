#!/usr/bin/env python3
"""Append one path+content to a JSON chunk file. Usage: append_to_chunk.py CHUNK.json PATH (stdin=content)"""
import json
import os
import sys

def main():
    if len(sys.argv) != 3:
        print("Usage: append_to_chunk.py CHUNK.json PATH", file=sys.stderr)
        sys.exit(1)
    chunk, path = sys.argv[1], sys.argv[2]
    content = sys.stdin.read()
    data = {}
    if os.path.isfile(chunk):
        data = json.load(open(chunk, encoding="utf-8"))
    data[path] = content
    os.makedirs(os.path.dirname(chunk) or ".", exist_ok=True)
    with open(chunk, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    print(json.dumps({"path": path, "bytes": len(content), "chunk_size": len(data)}))

if __name__ == "__main__":
    main()
