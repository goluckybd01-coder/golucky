#!/usr/bin/env python3
"""Append one file to missing_mcp_content.jsonl from a content file."""
import json
import sys
from pathlib import Path

JSONL = Path("/workspace/.export-tmp/missing_mcp_content.jsonl")

def main():
    if len(sys.argv) != 3:
        print("Usage: append_missing_jsonl.py REL_PATH CONTENT_FILE", file=sys.stderr)
        sys.exit(1)
    rel, src = sys.argv[1], Path(sys.argv[2])
    content = src.read_text(encoding="utf-8")
    with JSONL.open("a", encoding="utf-8") as f:
        f.write(json.dumps({"path": rel, "content": content}, ensure_ascii=False) + "\n")
    print(f"appended {rel} ({len(content)} bytes)")

if __name__ == "__main__":
    main()
