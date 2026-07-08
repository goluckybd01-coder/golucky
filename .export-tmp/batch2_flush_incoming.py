#!/usr/bin/env python3
"""Flush .export-tmp/incoming/*.content files to /workspace (skip existing)."""
import json
import os

WORKSPACE = "/workspace"
INCOMING = "/workspace/.export-tmp/incoming"


def path_from_name(name: str) -> str:
    if not name.endswith(".content"):
        raise ValueError(name)
    return name[:-8].replace("__", "/")


def write_file(rel: str, content: str) -> str:
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
    written = skipped = failed = 0
    failures = []
    if not os.path.isdir(INCOMING):
        print(json.dumps({"written": 0, "skipped": 0, "failed": 0, "failures": []}))
        return
    for name in sorted(os.listdir(INCOMING)):
        if not name.endswith(".content"):
            continue
        rel = path_from_name(name)
        try:
            content = open(os.path.join(INCOMING, name), encoding="utf-8").read()
            if not content or content.startswith("Lovable API error"):
                failed += 1
                failures.append(rel)
                continue
            result = write_file(rel, content)
            if result == "written":
                written += 1
            else:
                skipped += 1
        except Exception as e:
            failed += 1
            failures.append(f"{rel}: {e}")
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures}))


if __name__ == "__main__":
    main()
