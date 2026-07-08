#!/usr/bin/env python3
"""Write all files from .export-tmp/staging/ to workspace. Names use __ for /."""
import os
import sys

STAGING = "/workspace/.export-tmp/staging"
WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"


def dec(name: str) -> str:
    if name.endswith(".content"):
        name = name[:-8]
    return name.replace("__", "/")


def write_file(rel: str, content: str) -> None:
    if not content or content.startswith("Lovable API error"):
        raise ValueError("invalid content")
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
    os.makedirs(STAGING, exist_ok=True)
    ok = fail = 0
    for name in sorted(os.listdir(STAGING)):
        src = os.path.join(STAGING, name)
        if not os.path.isfile(src):
            continue
        rel = dec(name)
        try:
            with open(src, encoding="utf-8") as f:
                content = f.read()
            write_file(rel, content)
            os.remove(src)
            print(f"OK {rel} ({len(content)} bytes)")
            ok += 1
        except Exception as e:
            print(f"FAIL {rel}: {e}", file=sys.stderr)
            fail += 1
    ps = -1
    if os.path.isfile(PENDING):
        import json
        data = json.load(open(PENDING, encoding="utf-8"))
        ps = len([p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))])
    print({"written": ok, "failed": fail, "pending_src": ps})


if __name__ == "__main__":
    main()
