#!/usr/bin/env python3
"""Copy staged content files to workspace paths (skip existing)."""
import json
import os
import sys

WORKSPACE = "/workspace"
STAGING = "/workspace/.export-tmp/staging"


def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    if os.path.isfile(full):
        return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"


def main():
    manifest = sys.argv[1] if len(sys.argv) > 1 else os.path.join(STAGING, "manifest.json")
    mapping = json.load(open(manifest, encoding="utf-8"))
    written = skipped = failed = 0
    failures = []
    for path, staging_name in mapping.items():
        src = os.path.join(STAGING, staging_name)
        if not os.path.isfile(src):
            failed += 1
            failures.append(f"{path}: missing staging {staging_name}")
            continue
        with open(src, encoding="utf-8") as f:
            content = f.read()
        try:
            status = write_file(path, content)
            if status == "written":
                written += 1
            else:
                skipped += 1
        except Exception as e:
            failed += 1
            failures.append(f"{path}: {e}")
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures}))


if __name__ == "__main__":
    main()
