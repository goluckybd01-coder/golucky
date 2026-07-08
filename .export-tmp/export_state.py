#!/usr/bin/env python3
"""Continuous export state manager and batch writer."""
import json, os, sys, glob, time

WORKSPACE = "/workspace"
MANIFEST = "/workspace/.export-tmp/full_manifest.json"
INCOMING = "/workspace/.export-tmp/incoming"
STATE = "/workspace/.export-tmp/export_state.json"

os.makedirs(INCOMING, exist_ok=True)

def load_manifest():
    with open(MANIFEST) as f:
        return json.load(f)

def pending(paths=None):
    m = load_manifest()
    all_paths = paths or m.get("src_text_files", [])
    return [p for p in all_paths if not os.path.exists(os.path.join(WORKSPACE, p))]

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
                if content is None:
                    fail += 1
                    continue
                write_file(path, content)
                ok += 1
            os.remove(jf)
        except Exception as e:
            print(f"FAIL {jf}: {e}", file=sys.stderr)
            fail += 1
    return ok, fail

def status():
    m = load_manifest()
    src = m.get("src_text_files", [])
    exp = len([p for p in src if os.path.exists(os.path.join(WORKSPACE, p))])
    pen = len(src) - exp
    return {"src_total": len(src), "exported": exp, "pending": pen}

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "status":
        print(json.dumps(status()))
    elif cmd == "pending":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 50
        off = int(sys.argv[3]) if len(sys.argv) > 3 else 0
        p = pending()[off:off+n]
        print(json.dumps({"batch": p, "count": len(p), **status()}))
    elif cmd == "flush":
        ok, fail = flush_incoming()
        print(json.dumps({"ok": ok, "fail": fail, **status()}))
    elif cmd == "watch":
        print("Watching incoming/*.json ...", flush=True)
        while True:
            files = glob.glob(os.path.join(INCOMING, "*.json"))
            if files:
                ok, fail = flush_incoming()
                print(json.dumps({"flushed": ok, "fail": fail, **status()}), flush=True)
            time.sleep(1)
    else:
        print("Usage: export_state.py [status|pending N OFF|flush|watch]")
