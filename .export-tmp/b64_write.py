#!/usr/bin/env python3
"""Write files from lines: path<TAB>base64(content). Skip if exists."""
import base64
import json
import os
import sys

WORKSPACE = "/workspace"


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "/workspace/.export-tmp/chunk.b64"
    written = skipped = failed = 0
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            if not line or "\t" not in line:
                continue
            rel, b64 = line.split("\t", 1)
            try:
                content = base64.b64decode(b64).decode("utf-8")
            except Exception:
                failed += 1
                continue
            full = os.path.join(WORKSPACE, rel)
            if os.path.isfile(full):
                skipped += 1
                continue
            if not content or content.startswith("Lovable API error"):
                failed += 1
                continue
            os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
            with open(full, "w", encoding="utf-8", newline="\n") as out:
                out.write(content)
                if content and not content.endswith("\n"):
                    out.write("\n")
            written += 1
    batch = json.load(open("/workspace/.export-tmp/batch_1.json"))
    existing = sum(1 for p in batch if os.path.isfile(os.path.join(WORKSPACE, p)))
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "total": len(batch), "on_disk": existing, "pending": len(batch) - existing}))


if __name__ == "__main__":
    main()
