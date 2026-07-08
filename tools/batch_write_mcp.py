#!/usr/bin/env python3
"""Write batch of {path: content} from JSON file or stdin. Overwrites existing."""
import json
import os
import sys

WORKSPACE = "/workspace"


def write_file(path: str, content: str) -> str:
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"


def main():
    if len(sys.argv) < 2:
        print("Usage: batch_write_mcp.py <json-file|-", file=sys.stderr)
        sys.exit(1)
    src = sys.argv[1]
    if src == "-":
        data = json.load(sys.stdin)
    else:
        data = json.load(open(src, encoding="utf-8"))
    written = []
    for path, content in data.items():
        write_file(path, content)
        written.append(path)
        print(f"Wrote {path} ({len(content)} bytes)")
    print(json.dumps({"written": len(written), "paths": written}))


if __name__ == "__main__":
    main()
