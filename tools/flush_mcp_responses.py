#!/usr/bin/env python3
"""Flush .export-tmp/mcp_responses/* to workspace."""
import os
import json

WORKSPACE = "/workspace"
SRC = "/workspace/.export-tmp/mcp_responses"
PENDING = "/workspace/.export-tmp/pending_all.json"


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
    os.makedirs(SRC, exist_ok=True)
    ok = skip = fail = 0
    for name in sorted(os.listdir(SRC)):
        path = os.path.join(SRC, name)
        if not os.path.isfile(path):
            continue
        rel = name.replace("__", "/")
        dst = os.path.join(WORKSPACE, rel)
        try:
            with open(path, encoding="utf-8") as f:
                content = f.read()
            if os.path.isfile(dst):
                os.remove(path)
                skip += 1
                continue
            write_file(rel, content)
            os.remove(path)
            print(f"OK {rel} ({len(content)} bytes)")
            ok += 1
        except Exception as e:
            fail += 1
            print(f"FAIL {rel}: {e}")
    ps = -1
    if os.path.isfile(PENDING):
        data = json.load(open(PENDING, encoding="utf-8"))
        ps = len([p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))])
    print(json.dumps({"written": ok, "skipped": skip, "failed": fail, "pending_src": ps}))


if __name__ == "__main__":
    main()
