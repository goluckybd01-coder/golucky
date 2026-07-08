#!/usr/bin/env python3
"""
Write a batch JSON file from individual content files in a staging dir.
Staging layout: .export-tmp/batch_staging/<encoded_path>.txt
Then flush: python3 tools/mcp_batch_export.py flush [batch_N.json]
Or add file: python3 tools/mcp_batch_export.py add REL_PATH < content.txt
"""
import json
import os
import sys

WORKSPACE = "/workspace"
STAGE = "/workspace/.export-tmp/batch_staging"
BATCH_DIR = "/workspace/.export-tmp/batches"


def enc(path: str) -> str:
    return path.replace("/", "__")


def write_file(rel: str, content: str) -> None:
    if not content:
        raise ValueError("empty content")
    head = content.lstrip()[:20]
    if rel.endswith(".tsx") and (head.startswith("@import") or head.startswith("@tailwind")):
        raise ValueError("corrupted tsx (css content)")
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")


def cmd_add(rel: str) -> None:
    content = sys.stdin.read()
    os.makedirs(STAGE, exist_ok=True)
    with open(os.path.join(STAGE, enc(rel)), "w", encoding="utf-8") as f:
        f.write(content)
    write_file(rel, content)
    print(f"OK {rel} ({len(content)} bytes)")


def cmd_flush(batch_name: str = "current.json") -> None:
    os.makedirs(BATCH_DIR, exist_ok=True)
    batch = {}
    if os.path.isdir(STAGE):
        for name in os.listdir(STAGE):
            path = os.path.join(STAGE, name)
            if os.path.isfile(path):
                rel = name.replace("__", "/")
                with open(path, encoding="utf-8") as f:
                    batch[rel] = f.read()
    out = os.path.join(BATCH_DIR, batch_name)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(batch, f)
    ok = fail = 0
    for rel, content in batch.items():
        try:
            write_file(rel, content)
            print(f"OK {rel} ({len(content)} bytes)")
            ok += 1
        except Exception as e:
            print(f"FAIL {rel}: {e}", file=sys.stderr)
            fail += 1
    print(json.dumps({"written": ok, "failed": fail, "batch": out}))


def cmd_from_json(json_path: str) -> None:
    with open(json_path, encoding="utf-8") as f:
        batch = json.load(f)
    ok = fail = 0
    for rel, content in batch.items():
        try:
            write_file(rel, content)
            print(f"OK {rel} ({len(content)} bytes)")
            ok += 1
        except Exception as e:
            print(f"FAIL {rel}: {e}", file=sys.stderr)
            fail += 1
    print(json.dumps({"written": ok, "failed": fail}))


def main():
    if len(sys.argv) < 2:
        print("Usage: mcp_batch_export.py add REL_PATH | flush [name] | from-json FILE")
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == "add":
        cmd_add(sys.argv[2])
    elif cmd == "flush":
        cmd_flush(sys.argv[2] if len(sys.argv) > 2 else "current.json")
    elif cmd == "from-json":
        cmd_from_json(sys.argv[2])
    else:
        print(f"Unknown command: {cmd}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
