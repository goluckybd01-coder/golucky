#!/usr/bin/env python3
"""Flush .export-tmp/reads/*.content files to workspace for batch_1 paths."""
import json
import os

WORKSPACE = "/workspace"
READS = "/workspace/.export-tmp/reads"
BATCH = "/workspace/.export-tmp/batch_1.json"


def safe(path: str) -> str:
    return path.replace("/", "__") + ".content"


def main():
    batch = json.load(open(BATCH))
    written = skipped = missing = 0
    for path in batch:
        dst = os.path.join(WORKSPACE, path)
        if os.path.exists(dst):
            skipped += 1
            continue
        src = os.path.join(READS, safe(path))
        if not os.path.exists(src):
            missing += 1
            continue
        content = open(src, encoding="utf-8").read()
        if not content or content.startswith("Lovable API error"):
            missing += 1
            continue
        os.makedirs(os.path.dirname(dst) or WORKSPACE, exist_ok=True)
        with open(dst, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
            if content and not content.endswith("\n"):
                f.write("\n")
        written += 1
    print(json.dumps({"written": written, "skipped": skipped, "missing": missing, "total": len(batch)}))


if __name__ == "__main__":
    main()
