#!/usr/bin/env python3
"""Write exported file contents from JSON mapping {path: content}."""
import json
import os
import sys

WORKSPACE = "/workspace"


def write_file(rel: str, content: str) -> None:
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    if content and not content.endswith("\n"):
        content += "\n"
    with open(full, "w", encoding="utf-8") as f:
        f.write(content)


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: write_fetched.py <mapping.json>", file=sys.stderr)
        sys.exit(1)
    with open(sys.argv[1], encoding="utf-8") as f:
        mapping = json.load(f)
    for path, content in mapping.items():
        write_file(path, content)
        print(f"Wrote {path}")


if __name__ == "__main__":
    main()
