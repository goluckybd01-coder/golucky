#!/usr/bin/env python3
"""Write files from staging manifest: JSON array of {path, file} where file is path to content."""
import json
import os
import sys

WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"


def write_file(rel: str, content: str) -> None:
    if not content or str(content).startswith("Lovable API error"):
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
    manifest = json.load(open(sys.argv[1], encoding="utf-8"))
    ok = fail = 0
    for item in manifest:
        path = item["path"]
        src = item["file"]
        try:
            with open(src, encoding="utf-8") as f:
                content = f.read()
            write_file(path, content)
            print(f"OK {path} ({len(content)} bytes)")
            ok += 1
        except Exception as e:
            print(f"FAIL {path}: {e}")
            fail += 1
    ps = -1
    if os.path.isfile(PENDING):
        data = json.load(open(PENDING, encoding="utf-8"))
        ps = len([p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))])
    print(json.dumps({"written": ok, "failed": fail, "pending_src": ps}))


if __name__ == "__main__":
    main()
