#!/usr/bin/env python3
"""
Write files from .export-tmp/mcp_cache/*.content to workspace.
Cache files named like src__components__Foo.tsx.content
"""
import os, json, glob
WORKSPACE = "/workspace"
CACHE = "/workspace/.export-tmp/mcp_cache"
os.makedirs(CACHE, exist_ok=True)

def safe(path):
    return path.replace("/", "__")

def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")

def save_to_cache(path, content):
    with open(os.path.join(CACHE, safe(path) + ".content"), "w", encoding="utf-8") as f:
        f.write(content)

def flush_cache():
    ok = 0
    for cf in glob.glob(os.path.join(CACHE, "*.content")):
        path = os.path.basename(cf)[:-8].replace("__", "/")
        with open(cf, encoding="utf-8") as f:
            write_file(path, f.read())
        ok += 1
    return ok

if __name__ == "__main__":
    import sys
    if sys.argv[1] == "flush":
        print(json.dumps({"flushed": flush_cache()}))
    elif sys.argv[1] == "save" and len(sys.argv) >= 4:
        save_to_cache(sys.argv[2], sys.argv[3])
        write_file(sys.argv[2], sys.argv[3])
        print(json.dumps({"ok": sys.argv[2]}))
