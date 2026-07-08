#!/usr/bin/env python3
"""Flush all staging dirs to workspace via mcp_immediate_write.py."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")
PENDING = os.path.join(WORKSPACE, ".export-tmp/pending_all.json")

STAGING_DIRS = [
    os.path.join(WORKSPACE, ".export-tmp/fetched"),
    os.path.join(WORKSPACE, ".export-tmp/mcp_incoming"),
    os.path.join(WORKSPACE, ".export-tmp/staging_batch40"),
]


def stage_to_rel(stage_name: str) -> str:
    if stage_name.startswith("src__"):
        return stage_name.replace("__", "/")
    return stage_name


def write_one(rel: str, content: str):
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    return r.returncode == 0, (r.stderr or r.stdout).strip()


def main():
    paths = []
    if os.path.isfile(PENDING):
        data = json.load(open(PENDING, encoding="utf-8"))
        paths = data.get("pending_src_paths", [])[:40]

    written = skipped = failed = 0
    failures = []

    # Flush explicit pending paths from staging
    for rel in paths:
        dest = os.path.join(WORKSPACE, rel)
        if os.path.isfile(dest):
            skipped += 1
            continue
        stage_name = rel.replace("/", "__")
        content = None
        stage_path = None
        for d in STAGING_DIRS:
            candidate = os.path.join(d, stage_name)
            if os.path.isfile(candidate):
                stage_path = candidate
                break
        if not stage_path:
            failures.append({"path": rel, "error": "not staged"})
            failed += 1
            continue
        with open(stage_path, encoding="utf-8") as f:
            content = f.read()
        if not content.strip():
            failures.append({"path": rel, "error": "empty staged content"})
            failed += 1
            continue
        ok, msg = write_one(rel, content)
        if ok:
            written += 1
            print(msg)
        else:
            failures.append({"path": rel, "error": msg})
            failed += 1

    # Also flush any other staged files not in pending but missing on disk
    extra_written = 0
    for d in STAGING_DIRS:
        if not os.path.isdir(d):
            continue
        for name in os.listdir(d):
            rel = stage_to_rel(name)
            if not rel.startswith("src/"):
                continue
            dest = os.path.join(WORKSPACE, rel)
            if os.path.isfile(dest):
                continue
            if rel in paths:
                continue
            with open(os.path.join(d, name), encoding="utf-8") as f:
                content = f.read()
            if not content.strip():
                continue
            ok, msg = write_one(rel, content)
            if ok:
                extra_written += 1
                written += 1
                print(msg)

    still = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]
    print(json.dumps({
        "written": written,
        "skipped": skipped,
        "failed": failed,
        "extra_written": extra_written,
        "failures": failures,
        "still_missing": len(still),
        "still_missing_paths": still,
    }, indent=2))


if __name__ == "__main__":
    main()
