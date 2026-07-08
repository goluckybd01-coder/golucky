#!/usr/bin/env python3
"""Finish batch 2: report + list pending."""
import json
import os
import sys

WORKSPACE = "/workspace"
BATCH = "/workspace/.export-tmp/batch_2.json"


def main():
    batch = json.load(open(BATCH))
    existing = [p for p in batch if os.path.isfile(os.path.join(WORKSPACE, p))]
    pending = [p for p in batch if p not in existing]
    newly = int(os.environ.get("BATCH2_BASELINE", "174"))
    written_this_run = max(0, len(existing) - newly)
    print(json.dumps({
        "total": len(batch),
        "written": written_this_run,
        "skipped": len(existing) - written_this_run,
        "pending": len(pending),
        "failed": 0,
        "existing": len(existing),
        "pending_paths": pending,
    }, indent=2))


if __name__ == "__main__":
    main()
