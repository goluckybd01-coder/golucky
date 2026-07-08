#!/usr/bin/env python3
"""Persist MCP read_file responses. Usage: echo '{"path":"src/foo.tsx","content":"..."}' | python3 persist_mcp.py
Or: python3 persist_mcp.py path1 content_file1 path2 content_file2 ...
"""
import json
import pathlib
import sys

WORKSPACE = pathlib.Path("/workspace")


def write_file(rel: str, content: str) -> None:
    dst = WORKSPACE / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    if content and not content.endswith("\n"):
        content += "\n"
    dst.write_text(content, encoding="utf-8", newline="\n")
    print(f"OK {rel} ({len(content)} bytes)")


def main():
    if len(sys.argv) > 1 and sys.argv[1] != "-":
        args = sys.argv[1:]
        if len(args) % 2 != 0:
            print("Usage: persist_mcp.py <rel-path> <content-file> ...", file=sys.stderr)
            sys.exit(1)
        for i in range(0, len(args), 2):
            rel, src = args[i], args[i + 1]
            write_file(rel, pathlib.Path(src).read_text(encoding="utf-8"))
        return

    raw = sys.stdin.read().strip()
    if not raw:
        return
    data = json.loads(raw)
    if isinstance(data, dict) and "path" in data:
        write_file(data["path"], data["content"])
    elif isinstance(data, dict):
        for path, content in data.items():
            write_file(path, content)
    elif isinstance(data, list):
        for item in data:
            write_file(item["path"], item["content"])


if __name__ == "__main__":
    main()
