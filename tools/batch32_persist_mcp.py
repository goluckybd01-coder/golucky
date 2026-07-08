#!/usr/bin/env python3
"""Persist batch32 files from batch32_raw/ via mcp_immediate_write + stage incoming."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
RAW = os.path.join(WORKSPACE, ".export-tmp/batch32_raw")
INCOMING = os.path.join(WORKSPACE, ".export-tmp/batch32_incoming")
PATHS_FILE = os.path.join(WORKSPACE, ".export-tmp/batch32_paths.json")
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")


def enc(rel: str) -> str:
    return rel.replace("/", "__")


def write_one(rel: str, content: str) -> bool:
    if not content or not content.strip():
        print(f"SKIP empty: {rel}", file=sys.stderr)
        return False
    os.makedirs(INCOMING, exist_ok=True)
    os.makedirs(RAW, exist_ok=True)
    stage = os.path.join(INCOMING, enc(rel))
    raw = os.path.join(RAW, enc(rel))
    for fp in (stage, raw):
        with open(fp, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
            if not content.endswith("\n"):
                f.write("\n")
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        print(f"FAIL {rel}: {r.stderr or r.stdout}", file=sys.stderr)
        return False
    print(r.stdout.strip())
    return True


def main():
    if len(sys.argv) < 2:
        print("Usage: batch32_persist_mcp.py json|apply", file=sys.stderr)
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == "apply":
        paths = json.load(open(PATHS_FILE, encoding="utf-8"))
        written = 0
        for rel in paths:
            raw = os.path.join(RAW, enc(rel))
            if not os.path.isfile(raw):
                print(f"MISSING raw: {rel}", file=sys.stderr)
                continue
            with open(raw, encoding="utf-8") as f:
                content = f.read()
            if write_one(rel, content):
                written += 1
        print(json.dumps({"written": written, "total": len(paths)}))
        return
    # json mode: read JSON dict path->content from argv[2] or stdin
    src = sys.argv[2] if len(sys.argv) > 2 else None
    if src:
        data = json.load(open(src, encoding="utf-8"))
    else:
        data = json.load(sys.stdin)
    written = 0
    for rel, content in data.items():
        if write_one(rel, content):
            written += 1
    print(json.dumps({"written": written}))


if __name__ == "__main__":
    main()
