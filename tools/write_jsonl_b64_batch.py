#!/usr/bin/env python3
"""Append or write files from JSONL manifest: each line {"path":"...","b64":"..."}"""
import base64
import json
import os
import sys

WORKSPACE = "/workspace"
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
    path = sys.argv[1] if len(sys.argv) > 1 else "/workspace/.export-tmp/batch_manifest.jsonl"
    ok = fail = 0
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            rel = obj["path"]
            content = base64.b64decode(obj["b64"]).decode("utf-8")
            try:
                write_file(rel, content)
                print(f"OK {rel} ({len(content)} bytes)")
                ok += 1
            except Exception as e:
                print(f"FAIL {rel}: {e}", file=sys.stderr)
                fail += 1
    ps = -1
    if os.path.isfile(PENDING):
        data = json.load(open(PENDING, encoding="utf-8"))
        ps = len([p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))])
    print(json.dumps({"written": ok, "failed": fail, "pending_src": ps}))


if __name__ == "__main__":
    main()
