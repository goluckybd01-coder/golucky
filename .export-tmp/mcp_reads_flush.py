#!/usr/bin/env python3
"""
Flush .export-tmp/mcp_reads/*.content files to /workspace.
Naming: src__components__Foo.tsx.content -> src/components/Foo.tsx
"""
import os, glob, json

WORKSPACE = "/workspace"
READS = "/workspace/.export-tmp/mcp_reads"
os.makedirs(READS, exist_ok=True)

def safe(path):
    return path.replace("/", "__")

def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")

def flush():
    ok = fail = 0
    failed = []
    for cf in glob.glob(os.path.join(READS, "*.content")):
        path = os.path.basename(cf)[:-8].replace("__", "/")
        try:
            with open(cf, encoding="utf-8") as f:
                write_file(path, f.read())
            ok += 1
            os.remove(cf)
        except Exception as e:
            fail += 1
            failed.append({"path": path, "error": str(e)})
    return ok, fail, failed

def save(path, content):
    with open(os.path.join(READS, safe(path) + ".content"), "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    import sys
    if sys.argv[1] == "flush":
        ok, fail, failed = flush()
        print(json.dumps({"ok": ok, "fail": fail, "failed": failed}))
    elif sys.argv[1] == "save" and len(sys.argv) >= 3:
        content = sys.stdin.read()
        save(sys.argv[2], content)
        print(json.dumps({"saved": sys.argv[2], "bytes": len(content)}))
