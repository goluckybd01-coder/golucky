#!/usr/bin/env python3
"""Export batch_2 paths: write from JSON map, report status."""
import json, os, sys

WORKSPACE = "/workspace"
BATCH_FILE = "/workspace/.export-tmp/batch_2.json"

def load_paths():
    return json.load(open(BATCH_FILE))

def write_file(path, content):
    if os.path.isfile(os.path.join(WORKSPACE, path)):
        return "skipped"
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"

def write_map(data):
    results = {"written": 0, "skipped": 0, "failed": 0, "failures": []}
    for path, content in data.items():
        if content is None or str(content).startswith("Lovable API error"):
            results["failed"] += 1
            results["failures"].append(path)
            continue
        if os.path.isfile(os.path.join(WORKSPACE, path)):
            results["skipped"] += 1
            continue
        try:
            write_file(path, content)
            results["written"] += 1
        except Exception as e:
            results["failed"] += 1
            results["failures"].append(f"{path}: {e}")
    return results

def status():
    paths = load_paths()
    existing = [p for p in paths if os.path.isfile(os.path.join(WORKSPACE, p))]
    return {
        "total": len(paths),
        "exported": len(existing),
        "skipped_existing": len(existing),
        "pending": len(paths) - len(existing),
    }

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "status":
        print(json.dumps(status()))
    elif cmd == "pending":
        paths = load_paths()
        pending = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]
        n = int(sys.argv[2]) if len(sys.argv) > 2 else len(pending)
        print(json.dumps(pending[:n]))
    elif cmd == "write":
        src = sys.argv[2] if len(sys.argv) > 2 else None
        data = json.load(open(src) if src else sys.stdin)
        print(json.dumps(write_map(data)))
