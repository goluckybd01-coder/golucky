#!/usr/bin/env python3
"""
Write batch of files from JSON chunk (path -> content).
Usage: flush_chunk.py CHUNK.json [--force]
"""
import json
import os
import sys

WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"


def write_file(rel: str, content: str, force: bool = False) -> str:
    if not content or content.startswith("Lovable API error"):
        raise ValueError("invalid content")
    head = content.lstrip()[:20]
    if rel.endswith(".tsx") and (head.startswith("@import") or head.startswith("@tailwind")):
        raise ValueError("corrupted tsx")
    if rel.endswith(".tsx") and head.startswith("{"):
        raise ValueError("corrupted json tsx")
    full = os.path.join(WORKSPACE, rel)
    if os.path.isfile(full) and not force:
        with open(full, encoding="utf-8") as f:
            existing = f.read(200)
        if existing.lstrip()[:1] not in ("{", "L") and len(existing) > 50:
            return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")
    return "written"


def pending_src() -> int:
    if not os.path.isfile(PENDING):
        return -1
    data = json.load(open(PENDING, encoding="utf-8"))
    return len(
        [
            p
            for p in data.get("pending_src_paths", [])
            if not os.path.isfile(os.path.join(WORKSPACE, p))
        ]
    )


def main():
    if len(sys.argv) < 2:
        print("Usage: flush_chunk.py CHUNK.json [--force]", file=sys.stderr)
        sys.exit(1)
    chunk = sys.argv[1]
    force = "--force" in sys.argv
    data = json.load(open(chunk, encoding="utf-8"))
    stats = {"written": 0, "skipped": 0, "failed": 0}
    for path, content in data.items():
        try:
            r = write_file(path, content, force=force)
            if r == "written":
                stats["written"] += 1
                print(f"OK {path} ({len(content)} bytes)")
            else:
                stats["skipped"] += 1
        except Exception as e:
            stats["failed"] += 1
            print(f"FAIL {path}: {e}", file=sys.stderr)
    stats["pending_src"] = pending_src()
    print(json.dumps(stats))


if __name__ == "__main__":
    main()
