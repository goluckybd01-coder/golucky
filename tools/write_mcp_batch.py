#!/usr/bin/env python3
"""Write batch of {path: content} from JSON file to workspace."""
import json
import os
import sys

WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"


def write_file(rel: str, content: str) -> str:
    if not content or str(content).startswith("Lovable API error"):
        return "invalid"
    head = content.lstrip()[:20]
    if rel.endswith(".tsx") and (head.startswith("@import") or head.startswith("@tailwind")):
        return "corrupted"
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")
    return "written"


def main():
    if len(sys.argv) < 2:
        print("Usage: write_mcp_batch.py <json-file>", file=sys.stderr)
        sys.exit(1)
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    results = {"written": [], "skipped": [], "failed": []}
    for path, content in data.items():
        full = os.path.join(WORKSPACE, path)
        if os.path.isfile(full) and path != "src/components/admin/NewAdminShell.tsx":
            # allow overwrite for corrupted placeholder
            if os.path.getsize(full) > 100:
                results["skipped"].append(path)
                continue
        r = write_file(path, content)
        if r == "written":
            results["written"].append(path)
            print(f"OK {path} ({len(content)} bytes)")
        else:
            results["failed"].append({"path": path, "reason": r})
    if os.path.isfile(PENDING):
        pending = json.load(open(PENDING, encoding="utf-8"))
        ps = len([p for p in pending.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))])
        results["pending_src"] = ps
    print(json.dumps(results))

if __name__ == "__main__":
    main()
