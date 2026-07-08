#!/usr/bin/env python3
"""Process batch_1 export: report pending, write from incoming JSON chunks."""
import json, os, sys, glob

WORKSPACE = "/workspace"
BATCH = "/workspace/.export-tmp/batch_1.json"
INCOMING = "/workspace/.export-tmp/incoming"

def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    if os.path.exists(full):
        return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"

def status():
    batch = json.load(open(BATCH))
    pending = [p for p in batch if not os.path.exists(os.path.join(WORKSPACE, p))]
    existing = len(batch) - len(pending)
    return {"total": len(batch), "written": existing, "skipped": 0, "pending": len(pending), "next": pending[:20]}

def flush():
    stats = {"written": 0, "skipped": 0, "fail": 0}
    for jf in sorted(glob.glob(os.path.join(INCOMING, "chunk_*.json"))):
        data = json.load(open(jf, encoding="utf-8"))
        for path, content in data.items():
            if not content or str(content).startswith("Lovable API error"):
                stats["fail"] += 1
                continue
            r = write_file(path, content)
            stats[r if r in stats else "fail"] += 1
        os.remove(jf)
    s = status()
    print(json.dumps({**stats, **s}))

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "status":
        print(json.dumps(status(), indent=2))
    elif cmd == "flush":
        flush()
    else:
        print("Usage: batch1_export.py [status|flush]")
