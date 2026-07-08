#!/usr/bin/env python3
"""
Daemon that flushes incoming batches and reports status.
MCP fetching must be done by agent via CallMcpTool.
Agent workflow:
  1. python3 rapid_export.py pending 50 > batch.txt
  2. CallMcpTool read_file for each path
  3. Write results to /workspace/.export-tmp/incoming/batch_NNN.json
  4. This daemon auto-flushes
"""
import json, os, sys, glob, time

WORKSPACE = "/workspace"
INCOMING = "/workspace/.export-tmp/incoming"
CACHE = "/workspace/.export-tmp/mcp_cache"
MANIFEST = "/workspace/.export-tmp/full_manifest.json"
STATUS = "/workspace/.export-tmp/EXPORT_STATUS.json"

def pending():
    with open(MANIFEST) as f:
        m = json.load(f)
    return [p for p in m.get("src_text_files", []) if not os.path.exists(os.path.join(WORKSPACE, p))]

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
                if content is None or str(content).startswith("Lovable API error"):
                    fail += 1
                    continue
                write_file(path, content)
                ok += 1
            os.remove(jf)
        except Exception as e:
            print(f"ERR {jf}: {e}", file=sys.stderr)
            fail += 1
    for cf in glob.glob(os.path.join(CACHE, "*")):
        rel = os.path.basename(cf).replace("__", "/")
        try:
            content = open(cf, encoding="utf-8").read()
            if content and not content.startswith("Lovable API error"):
                write_file(rel, content)
                ok += 1
            os.remove(cf)
        except Exception:
            fail += 1
    return ok, fail

def update_status():
    pen = pending()
    exported = 870 - len(pen)
    status = {
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "pagination_complete": True,
        "pagination_pages": 21,
        "src_text_listed": 870,
        "exported_src": exported,
        "pending_src": len(pen),
        "incoming_batches": len(glob.glob(os.path.join(INCOMING, "*.json"))),
        "cache_files": len(glob.glob(os.path.join(CACHE, "*"))),
    }
    json.dump(status, open(STATUS, "w"), indent=2)
    return status

if __name__ == "__main__":
    print("Export flush daemon starting...", flush=True)
    while True:
        ok, fail = flush()
        if ok or fail:
            s = update_status()
            print(json.dumps({"flushed": ok, "fail": fail, **s}), flush=True)
        time.sleep(0.3)
