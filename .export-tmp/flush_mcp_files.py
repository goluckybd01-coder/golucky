#!/usr/bin/env python3
"""Write files from JSON dict {path: content}, skip if exists."""
import json
import os
import sys

WORKSPACE = "/workspace"


def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    if os.path.isfile(full):
        return "skipped"
    if not content or str(content).startswith("Lovable API error"):
        return "failed"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"


def main():
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    stats = {"written": 0, "skipped": 0, "failed": 0}
    for path, content in data.items():
        r = write_file(path, content)
        stats[r if r in stats else "failed"] += 1
    batch = json.load(open("/workspace/.export-tmp/batch_1.json"))
    existing = sum(1 for p in batch if os.path.isfile(os.path.join(WORKSPACE, p)))
    stats.update({"total": len(batch), "pending": len(batch) - existing})
    print(json.dumps(stats))


if __name__ == "__main__":
    main()
