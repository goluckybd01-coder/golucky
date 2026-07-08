#!/usr/bin/env python3
"""Write all mcp_cache files to workspace."""
import os, json, glob

WORKSPACE = "/workspace"
CACHE = "/workspace/.export-tmp/mcp_cache"

def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")

def main():
    ok = fail = 0
    failures = []
    for cf in glob.glob(os.path.join(CACHE, "*")):
        rel = os.path.basename(cf).replace("__", "/")
        try:
            with open(cf, encoding="utf-8") as f:
                content = f.read()
            if not content or content.startswith("Lovable API error"):
                fail += 1
                failures.append(rel)
                continue
            write_file(rel, content)
            os.remove(cf)
            ok += 1
        except Exception as e:
            fail += 1
            failures.append({"path": rel, "error": str(e)})
    print(json.dumps({"ok": ok, "fail": fail, "failures": failures}))

if __name__ == "__main__":
    main()
