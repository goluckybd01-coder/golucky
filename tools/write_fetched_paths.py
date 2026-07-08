#!/usr/bin/env python3
"""Write files from Lovable by path list - reads content from stdin JSONL {path, content}."""
import json
import sys
import os

WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"


def write_file(rel: str, content: str) -> None:
    if not content or content.startswith("Lovable API error"):
        raise ValueError("invalid content")
    head = content.lstrip()[:30]
    if rel.endswith(".tsx") and (head.startswith("@import") or head.startswith("@tailwind")):
        raise ValueError("corrupted tsx")
    if content.lstrip().startswith("{") and '"data"' in content[:400]:
        raise ValueError("corrupted json")
    if "Lovable MCP Server:" in content[:200]:
        raise ValueError("corrupted web scrape")
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")


def pending_src() -> int:
    if not os.path.isfile(PENDING):
        return -1
    data = json.load(open(PENDING, encoding="utf-8"))
    return len([p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))])


def main():
    ok = fail = 0
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
            write_file(obj["path"], obj["content"])
            print(f"OK {obj['path']} ({len(obj['content'])} bytes)")
            ok += 1
        except Exception as e:
            print(f"FAIL: {e}", file=sys.stderr)
            fail += 1
    print(json.dumps({"written": ok, "failed": fail, "pending_src": pending_src()}))


if __name__ == "__main__":
    main()
