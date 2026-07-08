#!/usr/bin/env python3
"""Export pending src files from Lovable via MCP HTTP or staged JSONL."""
import json
import os
import subprocess
import sys

WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"
JSONL = "/workspace/.export-tmp/export_batch.jsonl"
WRITE = "/workspace/tools/mcp_immediate_write.py"
FLUSH = "/workspace/.export-tmp/flush_jsonl.py"


def missing_paths():
    data = json.load(open(PENDING, encoding="utf-8"))
    paths = data.get("pending_src_paths", [])
    return [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]


def write_one(rel: str, content: str):
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    return r.returncode == 0, (r.stderr or r.stdout).strip()


def flush_jsonl():
  if not os.path.isfile(JSONL):
    return {"written": 0, "failed": 0, "failures": [], "note": "no jsonl"}
  r = subprocess.run([sys.executable, FLUSH, JSONL], capture_output=True, text=True)
  print(r.stdout)
  if r.stderr:
    print(r.stderr, file=sys.stderr)
  return r.returncode == 0


def append_jsonl(rel: str, content: str):
    with open(JSONL, "a", encoding="utf-8") as f:
        f.write(json.dumps({"path": rel, "content": content}, ensure_ascii=False) + "\n")


def status():
    missing = missing_paths()
    staged = 0
    if os.path.isfile(JSONL):
        with open(JSONL, encoding="utf-8") as f:
            staged = sum(1 for line in f if line.strip())
    print(json.dumps({
        "missing": len(missing),
        "jsonl_entries": staged,
        "missing_paths": missing[:10],
    }))


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "status":
        status()
    elif cmd == "flush":
        flush_jsonl()
    elif cmd == "write":
        if len(sys.argv) != 3:
            print("Usage: export_pending_batch.py write <rel-path>", file=sys.stderr)
            sys.exit(1)
        rel = sys.argv[2]
        content = sys.stdin.read()
        ok, msg = write_one(rel, content)
        if ok:
            print(msg)
        else:
            print(msg, file=sys.stderr)
            sys.exit(1)
    else:
        print("Usage: export_pending_batch.py status|flush|write <rel-path>")
        sys.exit(1)


if __name__ == "__main__":
    main()
