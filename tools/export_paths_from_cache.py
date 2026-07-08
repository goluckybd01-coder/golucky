#!/usr/bin/env python3
"""Write paths from agent-tools cache via mcp_immediate_write.py (fast head match)."""
import glob
import json
import os
import re
import subprocess
import sys

TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
WORKSPACE = "/workspace"
WRITE = "/workspace/tools/mcp_immediate_write.py"


def stem(path: str) -> str:
    return os.path.splitext(os.path.basename(path))[0]


def valid(content: str) -> bool:
    if not content or len(content) < 80:
        return False
    if content.startswith("{") and "pagination" in content[:400]:
        return False
    if "Lovable API error" in content[:200]:
        return False
    head = content.lstrip()[:20]
    if head.startswith("@import") or head.startswith("@tailwind"):
        return False
    return True


def matches(content: str, path: str) -> bool:
    s = stem(path)
    pats = [
        rf"export\s+function\s+{re.escape(s)}\b",
        rf"export\s+const\s+{re.escape(s)}\b",
        rf"export\s+default\s+function\s+{re.escape(s)}\b",
        rf"export\s+default\s+{re.escape(s)}\b",
        rf"function\s+{re.escape(s)}\b",
        rf"const\s+{re.escape(s)}\s*=",
    ]
    head = content[:8000]
    return any(re.search(p, head) for p in pats)


def build_index():
    idx = []
    for tf in glob.glob(os.path.join(TOOLS, "*.txt")):
        try:
            with open(tf, encoding="utf-8", errors="replace") as f:
                head = f.read(12000)
            if valid(head):
                idx.append((tf, head))
        except OSError:
            pass
    return idx


def write_path(path: str, content: str) -> tuple[bool, str]:
    proc = subprocess.run(
        [sys.executable, WRITE, path],
        input=content,
        text=True,
        capture_output=True,
    )
    if proc.returncode != 0:
        return False, (proc.stderr or proc.stdout).strip()
    return True, proc.stdout.strip()


def main():
    paths = json.load(sys.stdin) if not sys.argv[1:] else sys.argv[1:]
    paths = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]
    index = build_index()
    written, failures = [], []
    used_files = set()

    for path in paths:
        hit = None
        for tf, head in index:
            if tf in used_files:
                continue
            if matches(head, path):
                hit = tf
                break
        if not hit:
            failures.append({"path": path, "error": "no cache match"})
            continue
        with open(hit, encoding="utf-8", errors="replace") as f:
            content = f.read()
        if not valid(content):
            failures.append({"path": path, "error": "invalid cached content"})
            continue
        ok, msg = write_path(path, content)
        if ok:
            written.append(path)
            used_files.add(hit)
            print(msg)
        else:
            failures.append({"path": path, "error": msg})

    print(json.dumps({"written": len(written), "failed": len(failures), "failures": failures}))


if __name__ == "__main__":
    main()
