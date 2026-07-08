#!/usr/bin/env python3
"""Write files from JSON map {path: content} to /workspace (skip existing)."""
import json
import os
import sys

WORKSPACE = "/workspace"


def write_file(rel: str, content: str) -> str:
    full = os.path.join(WORKSPACE, rel)
    if os.path.isfile(full):
        return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else None
    if not path:
        print("Usage: batch2_persist_from_mcp.py JSON_FILE", file=sys.stderr)
        sys.exit(1)
    data = json.load(open(path, encoding="utf-8"))
    written = skipped = failed = 0
    failures = []
    for rel, content in data.items():
        if content is None or str(content).startswith("Lovable API error"):
            failed += 1
            failures.append(rel)
            continue
        result = write_file(rel, content)
        if result == "written":
            written += 1
        else:
            skipped += 1
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures}))


if __name__ == "__main__":
    main()
