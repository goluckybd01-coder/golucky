#!/usr/bin/env python3
"""
High-throughput export helper.
Generates shell commands to write files from MCP cache.
Also writes directly from incoming JSON batches.

Usage:
  python3 rapid_export.py pending [n]     - list next n pending paths
  python3 rapid_export.py write-json FILE - write batch JSON to workspace
  python3 rapid_export.py flush           - flush incoming + cache
  python3 rapid_export.py status          - show counts
"""
import json, os, sys, glob, subprocess

WORKSPACE = "/workspace"
MANIFEST = "/workspace/.export-tmp/full_manifest.json"
INCOMING = "/workspace/.export-tmp/incoming"
CACHE = "/workspace/.export-tmp/mcp_cache"

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

def flush_all():
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
        except Exception as e:
            fail += 1
            print(f"ERR cache {rel}: {e}", file=sys.stderr)
    return ok, fail

def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "status":
        pen = pending()
        print(json.dumps({
            "src_total": 870,
            "exported": 870 - len(pen),
            "pending": len(pen),
            "incoming": len(glob.glob(os.path.join(INCOMING, "*.json"))),
            "cache": len(glob.glob(os.path.join(CACHE, "*"))),
        }))
    elif cmd == "pending":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 50
        batch = pending()[:n]
        print(json.dumps({"batch": batch, "count": len(batch)}))
    elif cmd == "write-json":
        data = json.load(open(sys.argv[2], encoding="utf-8"))
        ok = fail = 0
        for path, content in data.items():
            try:
                write_file(path, content)
                ok += 1
            except Exception as e:
                fail += 1
                print(f"FAIL {path}: {e}", file=sys.stderr)
        pen = pending()
        print(json.dumps({"ok": ok, "fail": fail, "pending": len(pen)}))
    elif cmd == "flush":
        ok, fail = flush_all()
        pen = pending()
        print(json.dumps({"flushed": ok, "fail": fail, "pending": len(pen), "exported": 870 - len(pen)}))
    else:
        print("Unknown command", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
