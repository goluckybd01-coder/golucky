#!/usr/bin/env python3
"""Flush staged MCP responses via mcp_immediate_write.py. Stage files under .export-tmp/mcp_stage/<path_with__slashes>"""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
STAGE = "/workspace/.export-tmp/mcp_stage"
WRITE = "/workspace/tools/mcp_immediate_write.py"
PENDING = "/workspace/.export-tmp/pending_all.json"


def enc(p: str) -> str:
    return p.replace("/", "__")


def pending_missing(paths=None):
    data = json.load(open(PENDING, encoding="utf-8"))
    all_paths = data.get("pending_src_paths", [])
    if paths is None:
        paths = all_paths
    return [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]


def flush(paths=None):
    written, failures = 0, []
    if not os.path.isdir(STAGE):
        print(json.dumps({"written": 0, "failed": 0, "failures": [], "note": "no stage dir"}))
        return
    for name in sorted(os.listdir(STAGE)):
        stage_file = os.path.join(STAGE, name)
        if not os.path.isfile(stage_file):
            continue
        rel = name.replace("__", "/")
        if paths is not None and rel not in paths:
            continue
        with open(stage_file, encoding="utf-8") as f:
            content = f.read()
        proc = subprocess.run(
            [sys.executable, WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if proc.returncode != 0:
            failures.append({"path": rel, "error": (proc.stderr or proc.stdout).strip()})
        else:
            written += 1
            os.remove(stage_file)
            print(proc.stdout.strip())
    print(json.dumps({"written": written, "failed": len(failures), "failures": failures}))


def stage(rel: str):
    content = sys.stdin.read()
    os.makedirs(STAGE, exist_ok=True)
    with open(os.path.join(STAGE, enc(rel)), "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    print(f"STAGED {rel} ({len(content)} bytes)")


def list_first40():
    missing = pending_missing()
    first40 = missing[:40]
    print(json.dumps(first40, indent=2))


def status():
    missing = pending_missing()
    first40 = missing[:40]
    staged = len(os.listdir(STAGE)) if os.path.isdir(STAGE) else 0
    on_disk = 40 - len(first40)
    print(json.dumps({
        "pending_src_missing": len(missing),
        "first40_still_missing": len(first40),
        "first40_written": on_disk,
        "staged": staged,
    }))


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "flush":
        flush()
    elif cmd == "stage":
        stage(sys.argv[2])
    elif cmd == "list":
        list_first40()
    elif cmd == "status":
        status()
    else:
        print("Usage: export_first40_runner.py status|list|stage REL|flush")
        sys.exit(1)


if __name__ == "__main__":
    main()
