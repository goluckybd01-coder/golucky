#!/usr/bin/env python3
"""High-throughput export: read pending, output paths for MCP; write from response JSON files."""
import json, os, sys, glob, subprocess, concurrent.futures

PROJECT = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
REF = "b4906a5c0e34d0a1506f50999eb5f9703ebb698e"
WORKSPACE = "/workspace"
MANIFEST = "/workspace/.export-tmp/full_manifest.json"
INCOMING = "/workspace/.export-tmp/incoming"
BATCHES = "/workspace/.export-tmp/batches"

os.makedirs(INCOMING, exist_ok=True)
os.makedirs(BATCHES, exist_ok=True)

def pending():
    with open(MANIFEST) as f:
        m = json.load(f)
    src = m.get("src_text_files", [])
    return [p for p in src if not os.path.exists(os.path.join(WORKSPACE, p))]

def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")

def flush_incoming():
    ok = fail = 0
    for jf in sorted(glob.glob(os.path.join(INCOMING, "*.json"))):
        try:
            data = json.load(open(jf, encoding="utf-8"))
            for path, content in data.items():
                if content is None or (isinstance(content, str) and content.startswith("Lovable API error")):
                    fail += 1
                    continue
                write_file(path, content)
                ok += 1
            os.remove(jf)
        except Exception as e:
            print(f"FAIL {jf}: {e}", file=sys.stderr)
            fail += 1
    return ok, fail

def write_batch_content(batch_file):
    data = json.load(open(batch_file, encoding="utf-8"))
    ok = fail = 0
    for path, content in data.items():
        if content is None:
            fail += 1
            continue
        write_file(path, content)
        ok += 1
    return ok, fail

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "status":
        pen = pending()
        print(json.dumps({"pending": len(pen), "exported": 870 - len(pen)}))
    elif cmd == "next":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 50
        batch = pending()[:n]
        out = os.path.join(BATCHES, f"paths_{len(glob.glob(BATCHES+'/paths_*.json'))+1:03d}.json")
        json.dump(batch, open(out, "w"), indent=2)
        print(json.dumps({"batch_file": out, "count": len(batch), "paths": batch}))
    elif cmd == "flush":
        ok, fail = flush_incoming()
        pen = pending()
        print(json.dumps({"flushed": ok, "fail": fail, "pending": len(pen), "exported": 870 - len(pen)}))
    elif cmd == "write":
        ok, fail = write_batch_content(sys.argv[2])
        pen = pending()
        print(json.dumps({"ok": ok, "fail": fail, "pending": len(pen)}))
    else:
        print("Usage: bulk_export.py [status|next N|flush|write FILE]")
