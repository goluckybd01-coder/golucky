#!/usr/bin/env python3
"""Write MCP content files to staging tree preserving relative paths."""
import json
import os
import sys

STAGING = "/workspace/.export-tmp/staging"


def write_staging(rel: str, content: str) -> None:
    full = os.path.join(STAGING, rel)
    os.makedirs(os.path.dirname(full) or STAGING, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")


def main():
    data = json.load(sys.stdin)
    for rel, content in data.items():
        write_staging(rel, content)
        print(json.dumps({"staged": rel, "bytes": len(content)}))


if __name__ == "__main__":
    main()
