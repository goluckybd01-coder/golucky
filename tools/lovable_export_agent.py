#!/usr/bin/env python3
"""
Helper for Lovable export workflow.
- save: read JSON {path: content} from stdin, write to .export-tmp/content/
- flush: flush content dir to workspace
- status: show pending counts
"""
import glob
import json
import os
import sys

WORKSPACE = "/workspace"
CONTENT = "/workspace/.export-tmp/content"
PENDING = "/workspace/.export-tmp/pending_all.json"


def encode_path(rel: str) -> str:
    return rel.replace("/", "__")


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


def pending_src() -> int:
    if not os.path.isfile(PENDING):
        return -1
    data = json.load(open(PENDING, encoding="utf-8"))
    return len([p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))])


def cmd_save():
    data = json.load(sys.stdin)
    os.makedirs(CONTENT, exist_ok=True)
    for path, content in data.items():
        staged = os.path.join(CONTENT, encode_path(path))
        with open(staged, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"STAGED {path} ({len(content)} bytes)")


def cmd_flush():
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
    print(json.dumps({"written": ok, "failed": fail, "pending_src": pending_src()}))


def cmd_write_batch(json_path: str):
    data = json.load(open(json_path, encoding="utf-8"))
    ok = fail = 0
    for path, content in data.items():
        try:
            write_file(path, content)
            print(f"OK {path} ({len(content)} bytes)")
            ok += 1
        except Exception as e:
            print(f"FAIL {path}: {e}")
            fail += 1
    print(json.dumps({"written": ok, "failed": fail, "pending_src": pending_src()}))


def main():
    if len(sys.argv) < 2:
        print("Usage: lovable_export_agent.py save|flush|write-batch <json>", file=sys.stderr)
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == "save":
        cmd_save()
    elif cmd == "flush":
        cmd_flush()
    elif cmd == "write-batch":
        cmd_write_batch(sys.argv[2])
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
