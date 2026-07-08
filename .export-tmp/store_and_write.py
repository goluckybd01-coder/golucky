#!/usr/bin/env python3
"""Save MCP read content to reads/*.content and optionally flush to workspace."""
import json, os, sys

READS = "/workspace/.export-tmp/reads"
WORKSPACE = "/workspace"

def safe(path):
    return path.replace("/", "__")

def save_content(path, content):
    os.makedirs(READS, exist_ok=True)
    with open(os.path.join(READS, safe(path) + ".content"), "w", encoding="utf-8") as f:
        f.write(content)

def write_workspace(path, content):
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: store_and_write.py <path> [--save-only]")
        sys.exit(1)
    path = sys.argv[1]
    save_only = "--save-only" in sys.argv
    content = sys.stdin.read()
    save_content(path, content)
    if not save_only:
        write_workspace(path, content)
    print(json.dumps({"ok": path, "bytes": len(content)}))
