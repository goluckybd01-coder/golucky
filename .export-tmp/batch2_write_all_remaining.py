#!/usr/bin/env python3
"""Write all remaining batch2 files from reads/*.content staging."""
import glob
import json
import os
import sys

WORKSPACE = "/workspace"
READS = "/workspace/.export-tmp/reads"
BATCH = "/workspace/.export-tmp/batch_2.json"


def path_to_read_name(rel):
    return rel.replace("/", "__") + ".content"


def write_file(rel, content):
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
    batch = json.load(open(BATCH))
    pending = [p for p in batch if not os.path.isfile(os.path.join(WORKSPACE, p))]
    written = skipped = failed = 0
    failures = []
    for rel in pending:
        cf = os.path.join(READS, path_to_read_name(rel))
        if not os.path.isfile(cf):
            failures.append({"path": rel, "error": "no staging content"})
            failed += 1
            continue
        content = open(cf, encoding="utf-8").read()
        if not content or content.startswith("Lovable API error"):
            failures.append({"path": rel, "error": "empty or error content"})
            failed += 1
            continue
        result = write_file(rel, content)
        if result == "written":
            written += 1
            os.remove(cf)
        else:
            skipped += 1
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures, "pending_before": len(pending)}))


if __name__ == "__main__":
    main()
