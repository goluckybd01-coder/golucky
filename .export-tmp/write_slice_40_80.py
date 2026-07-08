#!/usr/bin/env python3
"""Write batch_40_80 slice from staging/*.content via mcp_immediate_write."""
import glob
import json
import os
import subprocess
import sys

STAGING = "/workspace/.export-tmp/staging"
READS = "/workspace/.export-tmp/reads"
WRITE = "/workspace/tools/mcp_immediate_write.py"
WORKSPACE = "/workspace"
PATHS_FILE = "/workspace/.export-tmp/batch_40_80.json"


def load_paths():
    return set(json.load(open(PATHS_FILE, encoding="utf-8")))


def write_one(rel: str, content: str):
    full = os.path.join(WORKSPACE, rel)
    if os.path.isfile(full):
        return "skipped", None
    if not content:
        return "failed", "empty content"
    proc = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if proc.returncode:
        return "failed", (proc.stderr or proc.stdout).strip()
    return "written", proc.stdout.strip()


def iter_sources():
    paths = load_paths()
    # reads/*.content
    for cf in sorted(glob.glob(os.path.join(READS, "*.content"))):
        rel = os.path.basename(cf).replace("__", "/").replace(".content", "")
        if rel in paths:
            yield rel, open(cf, encoding="utf-8").read()
    # staging plain files
    for name in sorted(os.listdir(STAGING) if os.path.isdir(STAGING) else []):
        if name.endswith(".content"):
            rel = name.replace("__", "/").replace(".content", "")
        else:
            # manifest map basename -> rel in sidecar
            rel = None
            map_file = os.path.join(STAGING, "manifest.json")
            if os.path.isfile(map_file):
                manifest = json.load(open(map_file, encoding="utf-8"))
                rel = manifest.get(name)
            if not rel:
                continue
        if rel in paths:
            yield rel, open(os.path.join(STAGING, name), encoding="utf-8").read()
    # incoming JSON chunks
    for jf in sorted(glob.glob("/workspace/.export-tmp/incoming/slice40_*.json")):
        data = json.load(open(jf, encoding="utf-8"))
        for rel, content in data.items():
            if rel in paths:
                yield rel, content


def main():
    paths = load_paths()
    written = skipped = 0
    failures = []
    seen = set()
    for rel, content in iter_sources():
        if rel in seen:
            continue
        seen.add(rel)
        status, info = write_one(rel, content)
        if status == "written":
            written += 1
            print(info)
        elif status == "skipped":
            skipped += 1
        else:
            failures.append({"path": rel, "error": info})
    still = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]
    print(json.dumps({
        "written": written,
        "skipped": skipped,
        "failed": len(failures),
        "failures": failures,
        "still_missing": still,
        "still_missing_count": len(still),
    }))


if __name__ == "__main__":
    main()
