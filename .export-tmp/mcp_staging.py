#!/usr/bin/env python3
"""
Flush staged MCP content files to workspace.
Staging format: .export-tmp/staging/{path_with__slashes}.content
Also accepts JSONL on stdin: {"path":"...", "content":"..."}
"""
import json, os, sys, glob

WORKSPACE = "/workspace"
STAGING = "/workspace/.export-tmp/staging"
os.makedirs(STAGING, exist_ok=True)

def safe(path):
    return path.replace("/", "__")

def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")

def flush_staging():
    ok = fail = 0
    for cf in glob.glob(os.path.join(STAGING, "*.content")):
        path = os.path.basename(cf)[:-8].replace("__", "/")
        try:
            with open(cf, encoding="utf-8") as f:
                write_file(path, f.read())
            ok += 1
            os.remove(cf)
        except Exception as e:
            print(f"FAIL {path}: {e}", file=sys.stderr)
            fail += 1
    return ok, fail

def flush_jsonl():
    ok = fail = 0
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        item = json.loads(line)
        path = item.get("path")
        content = item.get("content")
        if not path or content is None:
            fail += 1
            continue
        try:
            write_file(path, content)
            ok += 1
        except Exception as e:
            print(f"FAIL {path}: {e}", file=sys.stderr)
            fail += 1
    return ok, fail

def save_staging(path, content):
    with open(os.path.join(STAGING, safe(path) + ".content"), "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "flush"
    if cmd == "flush":
        ok, fail = flush_staging()
        print(json.dumps({"ok": ok, "fail": fail}))
    elif cmd == "jsonl":
        ok, fail = flush_jsonl()
        print(json.dumps({"ok": ok, "fail": fail}))
    elif cmd == "save" and len(sys.argv) >= 3:
        content = sys.stdin.read()
        save_staging(sys.argv[2], content)
        write_file(sys.argv[2], content)
        print(json.dumps({"ok": sys.argv[2], "bytes": len(content)}))
    else:
        print("Usage: mcp_staging.py [flush|jsonl|save <path>]")
        sys.exit(1)
