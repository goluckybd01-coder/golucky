#!/usr/bin/env python3
"""Write all batch32 paths from batch32_raw via mcp_immediate_write + stage incoming."""
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


def main():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    written = missing = failed = 0
    failures = []
    for rel in paths:
        raw = os.path.join(RAW, enc(rel))
        if not os.path.isfile(raw):
            missing += 1
            failures.append({"path": rel, "error": "missing raw"})
            continue
        with open(raw, encoding="utf-8") as f:
            content = f.read()
        if not content.strip():
            failed += 1
            failures.append({"path": rel, "error": "empty"})
            continue
        for d in (RAW, INCOMING):
            os.makedirs(d, exist_ok=True)
            with open(os.path.join(d, enc(rel)), "w", encoding="utf-8", newline="\n") as out:
                out.write(content)
                if not content.endswith("\n"):
                    out.write("\n")
        r = subprocess.run(
            [sys.executable, WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode != 0:
            failed += 1
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
        else:
            written += 1
            print(r.stdout.strip())
    print(json.dumps({"written": written, "missing": missing, "failed": failed, "total": len(paths), "failures": failures}))


if __name__ == "__main__":
    main()
