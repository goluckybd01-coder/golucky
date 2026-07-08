#!/usr/bin/env python3
"""Fetch batch32 from Lovable MCP (broker HTTP) and write via mcp_immediate_write.py."""
import json
import os
import subprocess
import sys
import urllib.request

PROJECT = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
REF = "b4906a5c0e34d0a1506f50999eb5f9703ebb698e"
WORKSPACE = "/workspace"
PATHS_FILE = os.path.join(WORKSPACE, ".export-tmp/batch32_paths.json")
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")
MCP_URL = os.environ.get("CURSOR_MCP_HTTP", os.environ.get("LOVABLE_MCP_URL", "http://127.0.0.1:26054/mcp"))
TOKEN = os.environ.get("CURSOR_AGENT_IDENTITY_BROKER_TOKEN", "")


def headers():
    h = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    }
    if TOKEN:
        h["Authorization"] = f"Bearer {TOKEN}"
        h["X-Cursor-Agent"] = "1"
    return h


def post(payload):
    body = json.dumps(payload).encode()
    req = urllib.request.Request(MCP_URL, data=body, headers=headers(), method="POST")
    with urllib.request.urlopen(req, timeout=180) as resp:
        raw = resp.read().decode()
    for line in raw.splitlines():
        if line.startswith("data:"):
            return json.loads(line[5:].strip())
    return json.loads(raw)


def parse_text(data):
    if "error" in data:
        raise RuntimeError(str(data["error"]))
    for c in data.get("result", {}).get("content", []):
        if c.get("type") == "text":
            return c["text"]
    raise RuntimeError("no text content")


def mcp_init():
    post({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "batch32-broker-write", "version": "1.0"},
        },
    })
    post({"jsonrpc": "2.0", "method": "notifications/initialized"})


def mcp_read(path, req_id):
    data = post({
        "jsonrpc": "2.0",
        "id": req_id,
        "method": "tools/call",
        "params": {
            "name": "read_file",
            "arguments": {"project_id": PROJECT, "path": path, "ref": REF},
        },
    })
    text = parse_text(data)
    if not text or text.startswith("Lovable API error"):
        raise RuntimeError(text or "empty")
    return text


def write_one(rel, content):
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout).strip())
    return (r.stdout or "").strip()


def main():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    try:
        mcp_init()
    except Exception as e:
        print(f"MCP init note: {e}", file=sys.stderr)
    written = failed = 0
    failures = []
    rid = 2
    for path in paths:
        try:
            content = mcp_read(path, rid)
            rid += 1
            msg = write_one(path, content)
            written += 1
            print(msg)
        except Exception as e:
            failed += 1
            failures.append({"path": path, "error": str(e)})
            print(f"FAIL {path}: {e}", file=sys.stderr)
    print(json.dumps({"written": written, "failed": failed, "total": len(paths), "failures": failures}))


if __name__ == "__main__":
    main()
