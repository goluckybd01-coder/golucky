#!/usr/bin/env python3
"""
Batch 1 export daemon coordinator.
Reads pending paths, writes status. Actual MCP fetch done by agent.
Agent should: read pending chunk -> CallMcpTool -> save chunk JSON -> run flush.
"""
import json, os, sys, glob

WORKSPACE = "/workspace"
BATCH = "/workspace/.export-tmp/batch_1.json"
INCOMING = "/workspace/.export-tmp/incoming"
CHUNK_SIZE = 20

def pending():
    batch = json.load(open(BATCH))
    return [p for p in batch if not os.path.exists(os.path.join(WORKSPACE, p))]

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

def flush():
    s = {"written": 0, "skipped": 0, "fail": 0}
    for jf in sorted(glob.glob(os.path.join(INCOMING, "*.json"))):
        if "batch_1" not in os.path.basename(jf) and "chunk_" not in os.path.basename(jf):
            continue
        try:
            data = json.load(open(jf, encoding="utf-8"))
            for path, content in data.items():
                if not content or str(content).startswith("Lovable API error"):
                    s["fail"] += 1
                    continue
                r = write_file(path, content)
                s[r if r in s else "fail"] += 1
            os.remove(jf)
        except Exception as e:
            print(f"ERR {jf}: {e}", file=sys.stderr)
            s["fail"] += 1
    return s

def chunk(n=0):
    pen = pending()
    start = n * CHUNK_SIZE
    c = pen[start:start+CHUNK_SIZE]
    return {"chunk": n, "paths": c, "count": len(c), "pending": len(pen), "total": len(json.load(open(BATCH)))}

def status():
    batch = json.load(open(BATCH))
    pen = pending()
    return {
        "total": len(batch),
        "written": len(batch) - len(pen),
        "skipped": sum(1 for p in batch if os.path.exists(os.path.join(WORKSPACE, p))),
        "pending": len(pen),
    }

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "status":
        print(json.dumps(status(), indent=2))
    elif cmd == "chunk":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 0
        print(json.dumps(chunk(n), indent=2))
    elif cmd == "flush":
        s = flush()
        print(json.dumps({**s, **status()}, indent=2))
    else:
        print("Usage: batch1_daemon.py [status|chunk N|flush]")
