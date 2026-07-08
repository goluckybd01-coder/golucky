#!/usr/bin/env python3
"""Write batch_0 files from JSON {path: content}. Skips existing files."""
import json, os, sys

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
    if len(sys.argv) < 2:
        print("Usage: batch_write.py <json-file>")
        sys.exit(1)
    targets = set(json.load(open(BATCH, encoding="utf-8")))
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    exported = skipped = fail = 0
    failures = []
    for path, content in data.items():
        if path not in targets:
            continue
        if not content or str(content).startswith("Lovable API error"):
            fail += 1
            failures.append(path)
            continue
        result = write_file(path, content)
        if result == "skipped":
            skipped += 1
        else:
            exported += 1
    print(json.dumps({"exported": exported, "skipped": skipped, "failures": failures}))


if __name__ == "__main__":
    main()
