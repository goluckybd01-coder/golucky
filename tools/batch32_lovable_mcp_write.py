#!/usr/bin/env python3
"""Fetch batch32 from Lovable via local MCP HTTP and write via mcp_immediate_write.py."""
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
            data = json.loads(line[5:].strip())
            return data
    return json.loads(raw)


def mcp_initialize():
  rid = 1
  init = post({
      "jsonrpc": "2.0",
      "id": rid,
      "method": "initialize",
      "params": {
          "protocolVersion": "2024-11-05",
          "capabilities": {},
          "clientInfo": {"name": "batch32-write", "version": "1.0"},
      },
  })
  post({"jsonrpc": "2.0", "method": "notifications/initialized"})
  return init


def mcp_read(path, req_id):
    data = post({
        "jsonrpc": "2.0",
        "id": req_id,
        "method": "tools/call",
        "params": {
            "name": "read_file",
            "arguments": {"project_id": PROJECT, "path": path},
        },
    })
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
    return (r.stdout or "").strip()


def main():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    try:
        mcp_initialize()
    except Exception as e:
        print(f"MCP init failed: {e}", file=sys.stderr)
        sys.exit(2)
    written = failed = 0
    failures = []
    rid = 2
    for path in paths:
        try:
            content = mcp_read(path, rid)
            rid += 1
            if not content or content.startswith("Lovable API error"):
                raise RuntimeError(content or "empty")
            msg = write_one(path, content)
            written += 1
            print(msg)
        except Exception as e:
            failed += 1
            failures.append({"path": path, "error": str(e)})
            print(f"FAIL {path}: {e}", file=sys.stderr)
    print(json.dumps({"written": written, "failed": failed, "failures": failures}, indent=2))


if __name__ == "__main__":
    main()
