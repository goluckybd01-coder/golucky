#!/usr/bin/env python3
"""Flush path->content JSON map to workspace, skipping existing files."""
import json, os, sys

WORKSPACE = "/workspace"

def main():
    src = sys.argv[1] if len(sys.argv) > 1 else None
    data = json.load(open(src) if src else sys.stdin)
    written = skipped = failed = 0
    failures = []
    for path, content in data.items():
        full = os.path.join(WORKSPACE, path)
        if os.path.isfile(full):
            skipped += 1
            continue
        try:
            os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
            with open(full, "w", encoding="utf-8", newline="\n") as f:
                f.write(content)
                if content and not content.endswith("\n"):
                    f.write("\n")
            written += 1
        except Exception as e:
            failed += 1
            failures.append(f"{path}: {e}")
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures}))

if __name__ == "__main__":
    main()
