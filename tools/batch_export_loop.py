#!/usr/bin/env python3
"""Write all staged files from .export-tmp/content/ and report status."""
import glob
import json
import os
import sys

WORKSPACE = "/workspace"
CONTENT = "/workspace/.export-tmp/content"
PENDING = "/workspace/.export-tmp/pending_all.json"


def write_file(rel: str, content: str) -> None:
    if not content or content.startswith("Lovable API error"):
        raise ValueError("invalid content")
    head = content.lstrip()[:20]
    if rel.endswith(".tsx") and (head.startswith("@import") or head.startswith("@tailwind")):
        raise ValueError("corrupted tsx")
    if head.startswith("{") and '"data"' in content[:200]:
        raise ValueError("json corruption")
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")


def pending_src():
    data = json.load(open(PENDING, encoding="utf-8"))
    return len([p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))])


def main():
    os.makedirs(CONTENT, exist_ok=True)
    ok = fail = skip = 0
    for path in sorted(glob.glob(os.path.join(CONTENT, "*"))):
        if not os.path.isfile(path):
            continue
        rel = os.path.basename(path).replace("__", "/")
        dst = os.path.join(WORKSPACE, rel)
        try:
            with open(path, encoding="utf-8") as f:
                content = f.read()
            if os.path.isfile(dst):
                # Overwrite if corrupted
                with open(dst, encoding="utf-8") as f:
                    existing = f.read(200)
                if not (existing.lstrip().startswith("{") and '"data"' in existing[:200]):
                    os.remove(path)
                    skip += 1
                    continue
            write_file(rel, content)
            os.remove(path)
            print(f"OK {rel} ({len(content)} bytes)")
            ok += 1
        except Exception as e:
            print(f"FAIL {rel}: {e}")
            fail += 1
    print(json.dumps({"written": ok, "skipped": skip, "failed": fail, "pending_src": pending_src()}))


if __name__ == "__main__":
    main()
