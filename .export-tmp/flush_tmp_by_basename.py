#!/usr/bin/env python3
"""Copy .export-tmp/tmp/{basename} -> workspace path from batch_2 (skip existing)."""
import json
import os
from collections import defaultdict

WORKSPACE = "/workspace"
TMP = "/workspace/.export-tmp/tmp"
BATCH_FILE = "/workspace/.export-tmp/batch_2.json"


def main():
    paths = json.load(open(BATCH_FILE, encoding="utf-8"))
    by_base = defaultdict(list)
    for p in paths:
        by_base[os.path.basename(p)].append(p)

    written = skipped = failed = 0
    failures = []
    for base, rel_paths in sorted(by_base.items()):
        src = os.path.join(TMP, base)
        if not os.path.isfile(src):
            continue
        with open(src, encoding="utf-8") as f:
            content = f.read()
        if not content or content.startswith("Lovable API error"):
            failed += 1
            failures.append(base)
            continue
        for path in rel_paths:
            full = os.path.join(WORKSPACE, path)
            if os.path.isfile(full):
                skipped += 1
                continue
            os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
            with open(full, "w", encoding="utf-8", newline="\n") as out:
                out.write(content)
                if content and not content.endswith("\n"):
                    out.write("\n")
            written += 1
            break
        if os.path.isfile(src):
            os.remove(src)

    existing = sum(1 for p in paths if os.path.isfile(os.path.join(WORKSPACE, p)))
    print(json.dumps({
        "written": written, "skipped": skipped, "failed": failed,
        "failures": failures, "total": len(paths), "exported": existing,
        "pending": len(paths) - existing,
    }))


if __name__ == "__main__":
    main()
