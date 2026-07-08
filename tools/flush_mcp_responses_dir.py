#!/usr/bin/env python3
"""
Write staged MCP response files to workspace.
Stage files as: .export-tmp/mcp_responses/<path_with___for_slashes>
Then: python3 tools/flush_mcp_responses_dir.py
"""
import os
import sys

STAGE = "/workspace/.export-tmp/mcp_responses"
WORKSPACE = "/workspace"


def enc(path: str) -> str:
    return path.replace("/", "__")


def dec(name: str) -> str:
    return name.replace("__", "/")


def write_file(rel: str, content: str) -> str:
    if not content or content.startswith("Lovable API error"):
        raise ValueError("invalid")
    head = content.lstrip()[:20]
    if rel.endswith(".tsx") and (head.startswith("@import") or head.startswith("@tailwind")):
        raise ValueError("corrupted tsx")
    full = os.path.join(WORKSPACE, rel)
    if os.path.isfile(full):
        return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")
    return "written"


def main():
    os.makedirs(STAGE, exist_ok=True)
    written = skipped = failed = 0
    for name in sorted(os.listdir(STAGE)):
        src = os.path.join(STAGE, name)
        if not os.path.isfile(src):
            continue
        rel = dec(name)
        try:
            with open(src, encoding="utf-8") as f:
                content = f.read()
            r = write_file(rel, content)
            if r == "written":
                written += 1
                print(f"OK {rel}")
                os.remove(src)
            else:
                skipped += 1
        except Exception as e:
            failed += 1
            print(f"FAIL {rel}: {e}")
    pending = __import__("json").load(open("/workspace/.export-tmp/pending_all.json"))
    ps = len([p for p in pending.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))])
    print({"written": written, "skipped": skipped, "failed": failed, "pending_src": ps})


if __name__ == "__main__":
    main()
