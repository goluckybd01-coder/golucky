#!/usr/bin/env python3
"""
Export pending files via Lovable MCP using subprocess curl to local MCP bridge.
Falls back to reading batch JSON and writing results.
Usage:
  python3 mcp_parallel_export.py prepare [batch_size] [offset]
  python3 mcp_parallel_export.py write < batch_results.json
"""
import json, os, sys, subprocess, urllib.request

PROJECT_ID = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
REF = "b4906a5c0e34d0a1506f50999eb5f9703ebb698e"
WORKSPACE = "/workspace"
MANIFEST = "/workspace/.export-tmp/full_manifest.json"
MCP_URL = os.environ.get("LOVABLE_MCP_URL", "https://mcp.lovable.dev/mcp")

def pending_paths():
    with open(MANIFEST) as f:
        m = json.load(f)
    src = m.get("src_text_files", [])
    return [p for p in src if not os.path.exists(os.path.join(WORKSPACE, p))]

def mcp_read(path):
    body = json.dumps({
        "jsonrpc": "2.0", "id": 1, "method": "tools/call",
        "params": {"name": "read_file", "arguments": {
            "project_id": PROJECT_ID, "path": path, "ref": REF
        }}
    }).encode()
    headers = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}
    for key in ("CURSOR_AGENT_IDENTITY_BROKER_TOKEN", "CURSOR_SESSION_TOKEN", "MCP_AUTH_TOKEN"):
        if os.environ.get(key):
            headers["Authorization"] = f"Bearer {os.environ[key]}"
    req = urllib.request.Request(MCP_URL, data=body, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=120) as resp:
        raw = resp.read().decode()
    for line in raw.splitlines():
        if line.startswith("data:"):
            data = json.loads(line[5:].strip())
            if "result" in data:
                for c in data["result"].get("content", []):
                    if c.get("type") == "text":
                        return c["text"]
    data = json.loads(raw)
    if "error" in data:
        raise RuntimeError(data["error"])
    for c in data.get("result", {}).get("content", []):
        if c.get("type") == "text":
            return c["text"]
    raise RuntimeError(f"bad response: {raw[:300]}")

def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")

def cmd_prepare():
    batch_size = int(sys.argv[2]) if len(sys.argv) > 2 else 40
    offset = int(sys.argv[3]) if len(sys.argv) > 3 else 0
    pending = pending_paths()
    batch = pending[offset:offset+batch_size]
    out = "/workspace/.export-tmp/current_batch.json"
    with open(out, "w") as f:
        json.dump(batch, f, indent=2)
    print(json.dumps({"pending": len(pending), "batch": len(batch), "offset": offset, "paths": batch}))

def cmd_export():
    batch_size = int(sys.argv[2]) if len(sys.argv) > 2 else 40
    offset = int(sys.argv[3]) if len(sys.argv) > 3 else 0
    pending = pending_paths()
    batch = pending[offset:offset+batch_size]
    ok = fail = 0
    failures = []
    for path in batch:
        try:
            content = mcp_read(path)
            write_file(path, content)
            ok += 1
            if ok % 10 == 0:
                print(f"  exported {ok}/{len(batch)}", flush=True)
        except Exception as e:
            fail += 1
            failures.append({"path": path, "error": str(e)})
            print(f"FAIL {path}: {e}", flush=True)
    print(json.dumps({"ok": ok, "fail": fail, "failures": failures}))

def cmd_write():
    items = json.load(sys.stdin)
    ok = fail = 0
    failures = []
    for item in items:
        path = item.get("path")
        content = item.get("content")
        if not path or content is None:
            fail += 1
            failures.append(item)
            continue
        try:
            write_file(path, content)
            ok += 1
        except Exception as e:
            fail += 1
            failures.append({"path": path, "error": str(e)})
    print(json.dumps({"ok": ok, "fail": fail, "failures": failures}))

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "prepare"
    if cmd == "prepare":
        cmd_prepare()
    elif cmd == "export":
        cmd_export()
    elif cmd == "write":
        cmd_write()
    else:
        print(f"Unknown: {cmd}")
        sys.exit(1)
