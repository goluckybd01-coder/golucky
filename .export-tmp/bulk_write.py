#!/usr/bin/env python3
"""Write files from JSON {path: content}, skip if exists."""
import json, os, sys

WORKSPACE = "/workspace"

def main():
    if len(sys.argv) < 2:
        print("Usage: bulk_write.py <json_file>")
        sys.exit(1)
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    written = skipped = failed = 0
    for path, content in data.items():
        full = os.path.join(WORKSPACE, path)
        if os.path.exists(full):
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
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed}))

if __name__ == "__main__":
    main()
