#!/usr/bin/env python3
"""Copy staged .content files to workspace paths (skip if exists)."""
import json
import os
import sys

WORKSPACE = "/workspace"
STAGING = "/workspace/.export-tmp/staging"


def safe(path: str) -> str:
    return path.replace("/", "__") + ".content"


def main():
    mapping = json.load(sys.stdin) if not sys.argv[1:] else {p: p for p in sys.argv[1:]}
    if isinstance(mapping, list):
        mapping = {p: p for p in mapping}
    written = skipped = missing = 0
    for path in mapping:
        dst = os.path.join(WORKSPACE, path)
        if os.path.isfile(dst):
            skipped += 1
            continue
        src = os.path.join(STAGING, safe(path))
        if not os.path.isfile(src):
            missing += 1
            continue
        content = open(src, encoding="utf-8").read()
        os.makedirs(os.path.dirname(dst) or WORKSPACE, exist_ok=True)
        with open(dst, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
            if content and not content.endswith("\n"):
                f.write("\n")
        written += 1
    batch = json.load(open("/workspace/.export-tmp/batch_1.json"))
    on_disk = sum(1 for p in batch if os.path.isfile(os.path.join(WORKSPACE, p)))
    print(json.dumps({"written": written, "skipped": skipped, "missing": missing, "total": len(batch), "on_disk": on_disk, "pending": len(batch) - on_disk}))


if __name__ == "__main__":
    main()
