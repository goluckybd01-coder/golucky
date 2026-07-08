#!/usr/bin/env python3
"""Write multiple files using store_and_write pattern from paths list + content dir."""
import json, os, sys, subprocess

WORKSPACE = "/workspace"
MANIFEST = "/workspace/.export-tmp/full_manifest.json"
PROJECT = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
REF = "b4906a5c0e34d0a1506f50999eb5f9703ebb698e"
BATCH_DIR = "/workspace/.export-tmp/batches"

def pending():
    with open(MANIFEST) as f:
        m = json.load(f)
    src = m.get("src_text_files", [])
    return [p for p in src if not os.path.exists(os.path.join(WORKSPACE, p))]

def save_batch_request(batch_num, paths):
    req = {
        "batch": batch_num,
        "project_id": PROJECT,
        "ref": REF,
        "paths": paths,
        "output": f"{BATCH_DIR}/batch_{batch_num:03d}_content.json"
    }
    path = f"{BATCH_DIR}/batch_{batch_num:03d}_request.json"
    with open(path, "w") as f:
        json.dump(req, f, indent=2)
    return path

def write_batch_content(batch_file):
    if not os.path.exists(batch_file):
        return {"error": "missing", "file": batch_file}
    data = json.load(open(batch_file))
    ok = fail = 0
    for path, content in data.items():
        if content is None:
            fail += 1
            continue
        full = os.path.join(WORKSPACE, path)
        os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
        with open(full, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
            if content and not content.endswith("\n"):
                f.write("\n")
        ok += 1
    return {"ok": ok, "fail": fail}

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "status":
        p = pending()
        print(json.dumps({"pending": len(p), "exported": 870 - len(p)}))
    elif cmd == "next":
        size = int(sys.argv[2]) if len(sys.argv) > 2 else 40
        p = pending()[:size]
        # find next batch number
        existing = [f for f in os.listdir(BATCH_DIR) if f.startswith("batch_") and f.endswith("_request.json")]
        num = len(existing) + 1
        path = save_batch_request(num, p)
        print(json.dumps({"batch": num, "count": len(p), "request": path, "paths": p}))
    elif cmd == "write":
        result = write_batch_content(sys.argv[2])
        print(json.dumps(result))
    else:
        print("Usage: export_runner.py [status|next|write <file>]")
