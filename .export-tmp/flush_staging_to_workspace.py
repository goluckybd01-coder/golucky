#!/usr/bin/env python3
"""Copy staged MCP content to workspace paths. Skip if target exists."""
import json
import os
import sys

WORKSPACE = "/workspace"
STAGING = "/workspace/.export-tmp/staging"
BATCH = "/workspace/.export-tmp/batch_1.json"


def safe_name(path: str) -> str:
    return path.replace("/", "__")


def main():
    batch = json.load(open(BATCH))
    written = skipped = failed = 0
    for path in batch:
        dest = os.path.join(WORKSPACE, path)
        if os.path.exists(dest):
            skipped += 1
            continue
        src = os.path.join(STAGING, safe_name(path))
        if not os.path.exists(src):
            failed += 1
            continue
        with open(src, encoding="utf-8") as f:
            content = f.read()
        if not content or content.startswith("Lovable API error"):
            failed += 1
            continue
        os.makedirs(os.path.dirname(dest) or WORKSPACE, exist_ok=True)
        with open(dest, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
            if content and not content.endswith("\n"):
                f.write("\n")
        written += 1
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "pending": failed}))


if __name__ == "__main__":
    main()
