#!/usr/bin/env python3
"""Parse ===PATH=== / ===END=== blocks from stdin and write to workspace."""
import os, sys, json

WORKSPACE = "/workspace"

def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")

def main():
    text = sys.stdin.read()
    ok = fail = 0
    failed = []
    parts = text.split("===PATH===")
    for part in parts[1:]:
        if "===END===" not in part:
            continue
        header, content = part.split("===END===", 1)
        path = header.strip()
        content = content.lstrip("\n")
        if not path:
            continue
        try:
            write_file(path, content)
            ok += 1
        except Exception as e:
            fail += 1
            failed.append({"path": path, "error": str(e)})
    print(json.dumps({"ok": ok, "fail": fail, "failed": failed}))

if __name__ == "__main__":
    main()
