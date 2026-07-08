#!/usr/bin/env python3
"""Flush .export-tmp/content/* (__ path encoding) to workspace."""
import glob
import json
import os

CONTENT = "/workspace/.export-tmp/content"
WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"


def write_file(rel: str, content: str) -> None:
    if not content:
        raise ValueError("empty")
    head = content.lstrip()[:20]
    if rel.endswith(".tsx") and (head.startswith("@import") or head.startswith("@tailwind")):
        raise ValueError("corrupted tsx")
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")


def main():
    os.makedirs(CONTENT, exist_ok=True)
    ok = fail = 0
    for path in sorted(glob.glob(os.path.join(CONTENT, "*"))):
        if not os.path.isfile(path):
            continue
        rel = os.path.basename(path).replace("__", "/")
        try:
            with open(path, encoding="utf-8") as f:
                content = f.read()
            write_file(rel, content)
            os.remove(path)
            print(f"OK {rel} ({len(content)} bytes)")
            ok += 1
        except Exception as e:
            print(f"FAIL {rel}: {e}")
            fail += 1
    data = json.load(open(PENDING, encoding="utf-8"))
    ps = len([p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))])
    print(json.dumps({"written": ok, "failed": fail, "pending_src": ps}))


if __name__ == "__main__":
    main()
