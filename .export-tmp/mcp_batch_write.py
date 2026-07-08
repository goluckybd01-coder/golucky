#!/usr/bin/env python3
"""Write files from JSON on stdin: {"path": "content", ...}. Skip if exists."""
import json
import os
import sys

WORKSPACE = "/workspace"


def main():
    data = json.load(sys.stdin)
    written = skipped = failed = 0
    for path, content in data.items():
        full = os.path.join(WORKSPACE, path)
        if os.path.isfile(full):
            skipped += 1
            continue
        if not content or str(content).startswith("Lovable API error"):
            failed += 1
            continue
        os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
        with open(full, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
            if content and not content.endswith("\n"):
                f.write("\n")
        written += 1
        print(f"WROTE {path}", file=sys.stderr)
    batch = json.load(open("/workspace/.export-tmp/batch_1.json"))
    existing = sum(1 for p in batch if os.path.isfile(os.path.join(WORKSPACE, p)))
    print(json.dumps({
        "written": written, "skipped": skipped, "failed": failed,
        "total": len(batch), "on_disk": existing, "pending": len(batch) - existing
    }))


if __name__ == "__main__":
    main()
