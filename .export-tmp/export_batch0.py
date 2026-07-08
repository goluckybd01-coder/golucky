#!/usr/bin/env python3
"""
Export batch_0.json paths using pre-fetched content JSONL.
Each line: {"path": "...", "content": "..."}
Also supports incremental single-file writes via write_one_stdin.py.
"""
import json, os, sys

WORKSPACE = "/workspace"
BATCH = "/workspace/.export-tmp/batch_0.json"

def write_file(path, content):
    dest = os.path.join(WORKSPACE, path)
    if os.path.isfile(dest):
        return "skipped"
    os.makedirs(os.path.dirname(dest) or WORKSPACE, exist_ok=True)
    with open(dest, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "exported"

def report():
    paths = json.load(open(BATCH, encoding="utf-8"))
    exported = skipped = missing = 0
    missing_paths = []
    for p in paths:
        dest = os.path.join(WORKSPACE, p)
        if os.path.isfile(dest):
            skipped += 1
        else:
            missing += 1
            missing_paths.append(p)
    print(json.dumps({
        "total": len(paths),
        "exported": len(paths) - missing - skipped + (0),
        "on_disk": len(paths) - missing,
        "skipped": skipped,
        "missing": missing,
        "missing_paths": missing_paths[:20],
        "missing_count": missing,
    }, indent=2))

def write_jsonl(jsonl_path):
    exported = skipped = fail = 0
    failures = []
    with open(jsonl_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                path, content = obj["path"], obj["content"]
                result = write_file(path, content)
                if result == "skipped":
                    skipped += 1
                else:
                    exported += 1
            except Exception as e:
                fail += 1
                failures.append({"line": line[:80], "error": str(e)})
    print(json.dumps({"exported": exported, "skipped": skipped, "failures": failures}, indent=2))

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "report":
        report()
    elif len(sys.argv) > 2 and sys.argv[1] == "jsonl":
        write_jsonl(sys.argv[2])
    else:
        report()
