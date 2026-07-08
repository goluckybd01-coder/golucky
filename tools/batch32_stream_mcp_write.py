#!/usr/bin/env python3
"""Fetch batch32 files via Cursor MCP HTTP (streamable) and write via mcp_immediate_write."""
import json
import os
import subprocess
import sys
import urllib.request

PROJECT = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
WORKSPACE = "/workspace"
PATHS_FILE = os.path.join(WORKSPACE, ".export-tmp/batch32_paths.json")
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")
MCP_URL = os.environ.get("CURSOR_MCP_HTTP", "http://127.0.0.1:26054/mcp")
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


def write_one(rel, content):
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout).strip())
    print(r.stdout.strip())


def main():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    rid = 1
    post({
        "jsonrpc": "2.0",
        "id": rid,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "batch32-stream", "version": "1.0"},
        },
    })
    rid += 1
    post({"jsonrpc": "2.0", "method": "notifications/initialized"})

    written = failed = 0
    failures = []
    for path in paths:
        try:
            data = post({
                "jsonrpc": "2.0",
                "id": rid,
                "method": "tools/call",
                "params": {
                    "name": "read_file",
                    "arguments": {"project_id": PROJECT, "path": path},
                },
            })
            rid += 1
            text = parse_text(data)
            if not text or text.startswith("Lovable API error"):
                raise RuntimeError(text or "empty")
            write_one(path, text)
            written += 1
        except Exception as e:
            failed += 1
            failures.append({"path": path, "error": str(e)})
            print(f"FAIL {path}: {e}", file=sys.stderr)

    print(json.dumps({"written": written, "failed": failed, "total": len(paths), "failures": failures}))


if __name__ == "__main__":
    main()
