#!/usr/bin/env python3
"""Export batch_0 files: read via stdin JSON {path: content}, skip existing."""
import json
import os
import sys

WORKSPACE = "/workspace"
BATCH = "/workspace/.export-tmp/batch_0.json"


def write_file(path, content):
    dest = os.path.join(WORKSPACE, path)
    if os.path.isfile(dest):
        return "skipped"
    os.makedirs(os.path.dirname(dest) or WORKSPACE, exist_ok=True)
    with open(dest, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "exported"


def main():
    targets = set(json.load(open(BATCH, encoding="utf-8")))
    if len(sys.argv) > 1:
        data = json.load(open(sys.argv[1], encoding="utf-8"))
    else:
        data = json.load(sys.stdin)

    exported = skipped = failed = 0
    failures = []
    for path, content in data.items():
        if path not in targets:
            continue
        if not content or str(content).startswith("Lovable API error"):
            failed += 1
            failures.append(path)
            continue
        try:
            r = write_file(path, content)
            if r == "skipped":
                skipped += 1
            else:
                exported += 1
        except Exception as e:
            failed += 1
            failures.append(f"{path}: {e}")

    missing = [p for p in targets if not os.path.isfile(os.path.join(WORKSPACE, p))]
    print(json.dumps({
        "exported": exported,
        "skipped": skipped,
        "failed": failed,
        "failures": failures[:20],
        "missing": len(missing),
        "on_disk": len(targets) - len(missing),
    }, indent=2))


if __name__ == "__main__":
    main()
