#!/usr/bin/env python3
"""Flush .export-tmp/tmp/{basename} -> workspace path from batch_2 pending list."""
import json
import os
import sys

WORKSPACE = "/workspace"
TMP = "/workspace/.export-tmp/tmp"
BATCH_FILE = "/workspace/.export-tmp/batch_2.json"


def main():
    paths = json.load(open(BATCH_FILE, encoding="utf-8"))
    pending = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]
    written = skipped = failed = 0
    failures = []
    for path in pending:
        base = os.path.basename(path)
        src = os.path.join(TMP, base)
        if not os.path.isfile(src):
            continue
        full = os.path.join(WORKSPACE, path)
        if os.path.isfile(full):
            skipped += 1
            continue
        try:
            with open(src, encoding="utf-8") as inf:
                content = inf.read()
            if not content or content.startswith("Lovable API error"):
                failed += 1
                failures.append(path)
                continue
            os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
            with open(full, "w", encoding="utf-8", newline="\n") as out:
                out.write(content)
                if content and not content.endswith("\n"):
                    out.write("\n")
            written += 1
            os.remove(src)
        except Exception as e:
            failed += 1
            failures.append(f"{path}: {e}")
    existing = sum(1 for p in paths if os.path.isfile(os.path.join(WORKSPACE, p)))
    print(json.dumps({
        "written": written, "skipped": skipped, "failed": failed,
        "failures": failures, "total": len(paths), "exported": existing,
        "pending": len(paths) - existing,
    }))


if __name__ == "__main__":
    main()
