#!/usr/bin/env python3
"""Write batch32 files from JSONL (one {"path","content"} per line) via mcp_immediate_write."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")
INCOMING = os.path.join(WORKSPACE, ".export-tmp/batch32_incoming")


def write_one(rel: str, content: str) -> tuple[bool, str]:
    os.makedirs(INCOMING, exist_ok=True)
    enc = rel.replace("/", "__")
    stage = os.path.join(INCOMING, enc)
    with open(stage, "w", encoding="utf-8", newline="\n") as f:
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
        return False, (r.stderr or r.stdout).strip()
    return True, r.stdout.strip()


def main():
    if len(sys.argv) < 2:
        print("Usage: batch32_write_from_jsonl.py FILE.jsonl", file=sys.stderr)
        sys.exit(1)
    written = failed = 0
    failures = []
    with open(sys.argv[1], encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            rel = obj["path"]
            content = obj.get("content", "")
            if not content.strip():
                failed += 1
                failures.append({"path": rel, "error": "empty"})
                continue
            ok, msg = write_one(rel, content)
            if ok:
                written += 1
                print(msg)
            else:
                failed += 1
                failures.append({"path": rel, "error": msg})
    print(json.dumps({"written": written, "failed": failed, "failures": failures}, indent=2))
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
