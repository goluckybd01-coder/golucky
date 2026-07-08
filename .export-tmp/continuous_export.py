#!/usr/bin/env python3
"""
Automated export runner - writes pending paths to queue file.
Agent should fetch via MCP and save to incoming/batch_NNN.json
Run: python3 continuous_export.py run
"""
import json, os, sys, glob, time

WORKSPACE = "/workspace"
MANIFEST = "/workspace/.export-tmp/full_manifest.json"
INCOMING = "/workspace/.export-tmp/incoming"
QUEUE = "/workspace/.export-tmp/export_queue.json"
BATCH_SIZE = 40

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

def flush():
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
            print(f"ERR {jf}: {e}", file=sys.stderr)
            fail += 1
    return ok, fail

def status():
    pen = pending()
    return {"pending": len(pen), "exported": 870 - len(pen), "incoming": len(glob.glob(os.path.join(INCOMING, "*.json")))}

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "status":
        print(json.dumps(status()))
    elif cmd == "next":
        pen = pending()
        n = int(sys.argv[2]) if len(sys.argv) > 2 else BATCH_SIZE
        batch = pen[:n]
        out = {"batch": batch, "count": len(batch), **status()}
        json.dump(out, open(QUEUE, "w"), indent=2)
        print(json.dumps(out))
    elif cmd == "flush":
        ok, fail = flush()
        print(json.dumps({"flushed": ok, "fail": fail, **status()}))
    elif cmd == "run":
        print("Flush daemon starting...", flush=True)
        while True:
            files = glob.glob(os.path.join(INCOMING, "*.json"))
            if files:
                ok, fail = flush()
                s = status()
                print(json.dumps({"flushed": ok, "fail": fail, **s}), flush=True)
            time.sleep(0.5)
    else:
        print("Usage: continuous_export.py [status|next|flush|run]")
